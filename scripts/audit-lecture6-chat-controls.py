#!/usr/bin/env python3
"""Reproduce short chat-format fixtures without model weights or remote Python execution.

Qwen/GLM: render pinned Jinja in a sandbox (Jinja2 3.1.6).
DeepSeek/Kimi: reconstruct only reviewed simple text branches from pinned
literal constants; do not import or execute their Python modules.
Run with --check, or --output content/fixtures/lecture6-chat-controls.json.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
from urllib.request import urlopen

import jinja2
from jinja2.sandbox import SandboxedEnvironment

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".tools/lecture6-tokenizers"
SNAPSHOT = ROOT / "content/fixtures/lecture6-chat-controls.json"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def artifact(model, filename, expected):
    path = CACHE / model["repository"].replace("/", "--") / model["revision"] / filename
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        url = f'https://huggingface.co/{model["repository"]}/resolve/{model["revision"]}/{filename}'
        with urlopen(url, timeout=30) as response:
            path.write_bytes(response.read())
    assert digest(path) == expected, f"Pinned digest mismatch: {model['name']}/{filename}"
    return path


def literal_constants(source):
    """Read only string literals, known-name references and string concatenation."""
    values = {}

    def value(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value
        if isinstance(node, ast.Name):
            return values[node.id]
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            return value(node.left) + value(node.right)
        raise ValueError("Not a literal string expression")

    for node in ast.parse(source).body:
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            name = node.target.id
        elif isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            name = node.targets[0].id
        else:
            continue
        try:
            values[name] = value(node.value)
        except (ValueError, KeyError):
            pass
    return values


def audit():
    old = json.loads((ROOT / "content/fixtures/lecture6-tokenizer-audit.json").read_text())
    env = SandboxedEnvironment(extensions=["jinja2.ext.loopcontrols"])
    env.filters["tojson"] = lambda value, **kw: json.dumps(value, ensure_ascii=kw.get("ensure_ascii", False))

    def fail(message):
        raise ValueError(message)

    env.globals["raise_exception"] = fail
    messages = [{"role": "system", "content": "Be concise."}, {"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi."}]
    tool_messages = [{"role": "user", "content": "What time is it?"}, {"role": "assistant", "content": "", "tool_calls": [{"id": "call_1", "type": "function", "function": {"name": "clock", "arguments": {}}}]}, {"role": "tool", "tool_call_id": "call_1", "content": "12:00"}]
    report = {"inspected_on": "2026-10-17", "jinja2": jinja2.__version__, "scope": "Short text-format fixtures; no model generation, tool execution, media processing or remote Python execution.", "messages": messages, "models": []}
    for model in old["models"]:
        name = model["name"]
        record = {"name": name, "repository": model["repository"], "revision": model["revision"], "sha256": {}}
        if name in ["Qwen3.8-27B", "GLM-5.3"]:
            path = artifact(model, "chat_template.jinja", model["sha256"]["chat_template.jinja"])
            record["sha256"][path.name] = digest(path)
            template = env.from_string(path.read_text())
            options = {"enable_thinking": False, "preserve_thinking": False, "clear_thinking": True, "add_generation_prompt": False}
            serialized = template.render(messages=messages, **options)
            tool_text = template.render(messages=tool_messages, **options)
            tool_start = tool_text.index("<tool_call>")
            call = tool_text[tool_start:tool_text.index("</tool_call>", tool_start) + len("</tool_call>")]
            record.update(verification="sandboxed Jinja render", options=options, serialized=serialized, tool_call=call)
            record["thinking_open"], record["thinking_close"] = "<think>", "</think>"
            if name.startswith("Qwen"):
                record["display_parts"] = [p for p in re.split(r"(?=<\|im_start\|>)", serialized) if p]
                result = tool_text[tool_text.index("<|im_start|>user", tool_start):]
                record.update(tool_result=result, tool_result_label="user + <tool_response>", call_label="<tool_call> + <function=...>")
            else:
                record["display_parts"] = [p for p in re.split(r"(?=<\|system\|>|<\|user\|>|<\|assistant\|>)", serialized) if p]
                record.update(tool_result=tool_text[tool_text.index("<|observation|>"):], tool_result_label="<|observation|>", call_label="<tool_call> + <arg_key>")
        elif name.startswith("DeepSeek"):
            path = artifact(model, "encoding/encoding_dsv4.py", "bdbd57c132a1b3725042323d02b98b9d1df28e5f388f134399555d041f5055e0")
            record["sha256"]["encoding/encoding_dsv4.py"] = digest(path)
            constants = literal_constants(path.read_text())
            parts = [constants["bos_token"] + "Be concise.", constants["USER_SP_TOKEN"] + "Hello", constants["ASSISTANT_SP_TOKEN"] + constants["thinking_end_token"] + constants["assistant_msg_template"].format(reasoning="", content="Hi.", tool_calls="")]
            call = constants["tool_call_template"].format(dsml_token=constants["dsml_token"], name="clock", arguments="")
            call = constants["tool_calls_template"].format(dsml_token=constants["dsml_token"], tc_block_name=constants["tool_calls_block_name"], tool_calls=call)
            result = constants["USER_SP_TOKEN"] + constants["tool_output_template"].format(content="12:00")
            record.update(verification="reviewed simple text branch reconstructed from AST-read literals; not publisher Python execution", options={"thinking_mode": "chat", "drop_thinking": True}, serialized="".join(parts), display_parts=parts, tool_call=call, tool_result=result, tool_result_label="<｜User｜> + <tool_result>", call_label="<｜DSML｜tool_calls>", thinking_open=constants["thinking_start_token"], thinking_close=constants["thinking_end_token"])
        else:
            path = artifact(model, "encoding_k3.py", model["sha256"]["encoding_k3.py"])
            record["sha256"][path.name] = digest(path)
            constants = literal_constants(path.read_text())
            op, cl, sep, end = [constants[k] for k in ["OPEN_TOKEN", "CLOSE_TOKEN", "SEP_TOKEN", "END_OF_MSG_TOKEN"]]

            def open_tag(tag, **attrs):
                return op + tag + "".join(f' {key}="{value}"' for key, value in attrs.items()) + sep

            def close_tag(tag):
                return cl + tag + sep

            parts = []
            for message in messages:
                body = message["content"]
                if message["role"] == "assistant":
                    body = open_tag("think") + close_tag("think") + open_tag("response") + body + close_tag("response")
                parts.append(open_tag("message", role=message["role"]) + body + close_tag("message") + end)
            call = open_tag("tools") + open_tag("call", tool="clock", index=1) + close_tag("call") + close_tag("tools")
            result = open_tag("message", role="tool", tool="clock", index=1) + "12:00" + close_tag("message") + end
            record.update(verification="reviewed simple text branch reconstructed from AST-read literals; not publisher Python execution", options={"thinking": True}, serialized="".join(parts), display_parts=parts, tool_call=call, tool_result=result, tool_result_label='message role="tool"', call_label='<|open|>call tool="..."', thinking_open=open_tag("think"), thinking_close=close_tag("think"))
        assert "".join(record["display_parts"]) == record["serialized"]
        record["display_code"] = "\n\n".join(part.replace("\n", "\\n") for part in record["display_parts"])
        report["models"].append(record)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = audit()
    if args.check:
        assert result == json.loads(SNAPSHOT.read_text()), "Chat-format snapshot mismatch"
        print("Chat-format fixtures reproduced; no remote Python, weights, tool execution or generation.")
    elif args.output:
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
        print(f"Wrote {args.output}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
