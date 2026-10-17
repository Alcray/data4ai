#!/usr/bin/env python3
"""Small, pinned text-tokenizer audit. No model weights or remote code execution.

Install scripts/requirements-lecture6-audit.txt in an isolated environment.
Run with --check to reproduce the checked-in snapshot. The optional --output
argument writes a generated report; downloaded artifacts stay in .tools/.
These short correctness fixtures are NOT a language-quality benchmark.
"""

import argparse
import ast
import base64
import hashlib
import importlib.metadata
import json
from pathlib import Path
import unicodedata
from urllib.request import urlopen

import tiktoken
from tokenizers import AddedToken, Tokenizer

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "content/fixtures/lecture6-tokenizer-audit.json"
MODELS = [
    ("Qwen3.8-27B", "Qwen/Qwen3.8-27B", "1d4bf0f2ff6012fd82039f2fa52739d0dd7c60c0", "0997f410c57a1f4e53b09e4be8f4a172d90edd9564368fb0847030937229b9f3"),
    ("DeepSeek-V4-Pro", "deepseek-ai/DeepSeek-V4-Pro", "b5968e9190ef611bbf34a7229255be88a0e937c1", "8f9f37ca37fdc4f5fd36d5cf4d3b0e8392edb4e894fd10cc0d70b4957c8633cf"),
    ("GLM-5.3", "zai-org/GLM-5.3", "c5087a76d148760811ffbdedfe6ff9f194e46e38", "19e773648cb4e65de8660ea6365e10acca112d42a854923df93db4a6f333a82d"),
    ("Kimi-K3", "moonshotai/Kimi-K3", "f831ab66814297da540d832a5235f8e904f29d06", "b6c497a7469b33ced9c38afb1ad6e47f03f5e5dc05f15930799210ec050c5103"),
]
FIXTURES = {
    "english": "The laboratory studies physics.",
    "chinese": "实验室研究物理。",
    "armenian": "Լաբորատորիան ուսումնասիրում է ֆիզիկա։",
    "armenian_news": "Երևանում բացվեց նոր գիտական կենտրոն։",
    "code": "def square(x):\n    return x * x\n",
    "digits": "123456789",
    "decomposed_accent": "e\u0301",
    "composed_accent": "é",
    "mixed": "Ա🙂 42",
}


def download(cache, repo, revision, filename):
    path = cache / repo.replace("/", "--") / revision / filename
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        with urlopen(f"https://huggingface.co/{repo}/resolve/{revision}/{filename}", timeout=60) as response:
            path.write_bytes(response.read())
    return path


def kimi_pattern(source):
    """Read a literal regex list via AST; never import/exec the publisher code."""
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "pat_str" for t in node.targets):
            call = node.value
            assert isinstance(call, ast.Call) and isinstance(call.func, ast.Attribute)
            assert call.func.attr == "join" and ast.literal_eval(call.func.value) == "|"
            patterns = ast.literal_eval(call.args[0])
            assert isinstance(patterns, list) and all(isinstance(x, str) for x in patterns)
            return "|".join(patterns)
    raise ValueError("Pinned Kimi pattern not found")


def audit(cache):
    report = {
        "inspected_on": "2026-10-13",
        "scope": "Nine short text-only correctness fixtures; no BOS/EOS insertion, no chat template, no media processing. Not a language benchmark.",
        "libraries": {name: importlib.metadata.version(name) for name in ["tokenizers", "tiktoken"]},
        "fixtures": FIXTURES,
        "models": [],
    }
    for name, repo, revision, core_hash in MODELS:
        is_kimi = name == "Kimi-K3"
        core = "tiktoken.model" if is_kimi else "tokenizer.json"
        filenames = [core, "tokenizer_config.json", "config.json"]
        if is_kimi:
            filenames.extend(["tokenization_kimi.py", "encoding_k3.py", "kimi_k3_processor.py"])
        if name in ["Qwen3.8-27B", "GLM-5.3"]:
            filenames.append("chat_template.jinja")
        paths = {f: download(cache, repo, revision, f) for f in filenames}
        hashes = {f: hashlib.sha256(p.read_bytes()).hexdigest() for f, p in paths.items()}
        assert hashes[core] == core_hash, f"{name}: tokenizer digest mismatch"
        config = json.loads(paths["config.json"].read_text())
        token_config = json.loads(paths["tokenizer_config.json"].read_text())
        if is_kimi:
            assert hashes["tokenization_kimi.py"] == "f28ea66e2d862a2a5814970b2ce40c2f7d8296ff09aed90a7e7def689b906944"
            ranks = {base64.b64decode(line.split()[0]): int(line.split()[1]) for line in paths[core].read_bytes().splitlines()}
            added = token_config["added_tokens_decoder"]
            reserved = {added.get(str(i), {}).get("content", f"<|reserved_token_{i}|>"): i for i in range(len(ranks), len(ranks) + 256)}
            tokenizer = tiktoken.Encoding(name=name, pat_str=kimi_pattern(paths["tokenization_kimi.py"].read_text()), mergeable_ranks=ranks, special_tokens=reserved)
            # Equivalent to the reviewed wrapper's allow_special_tokens=False
            # for these short inputs. Do not execute its remote Python class.
            encode = tokenizer.encode_ordinary
            decode = tokenizer.decode
            model_entries = len(ranks)
            effective_ids = tokenizer.n_vocab
            normalizer = None
        else:
            artifact = json.loads(paths[core].read_text())
            tokenizer = Tokenizer.from_file(str(paths[core]))
            # Reconcile configuration-supplied added IDs with the JSON artifact.
            for identifier, token in sorted(token_config.get("added_tokens_decoder", {}).items(), key=lambda item: int(item[0])):
                added_token = AddedToken(**{k: v for k, v in token.items() if k != "__type"})
                tokenizer.add_tokens([added_token])
                assert tokenizer.token_to_id(token["content"]) == int(identifier)
            encode = lambda text: tokenizer.encode(text, add_special_tokens=False).ids
            decode = lambda ids: tokenizer.decode(ids, skip_special_tokens=False)
            model_entries = len(artifact["model"]["vocab"])
            effective_ids = tokenizer.get_vocab_size()
            normalizer = artifact["normalizer"]
        results = {}
        for fixture, text in FIXTURES.items():
            ids = encode(text)
            decoded = decode(ids)
            expected = unicodedata.normalize("NFC", text) if name.startswith("Qwen") else text
            assert decoded == expected, f"{name}/{fixture}: round-trip contract failed"
            assert ids == encode(text), f"{name}/{fixture}: nondeterministic"
            assert all(0 <= i < effective_ids for i in ids)
            results[fixture] = {"count": len(ids), "ids": ids, "decoded": decoded, "original_bytes_preserved": decoded.encode() == text.encode()}
        record = {
            "name": name, "repository": repo, "revision": revision, "sha256": hashes,
            "model_entries": model_entries, "effective_ids": effective_ids,
            "embedding_rows": config.get("text_config", config)["vocab_size"],
            "normalizer": normalizer,
            "digit_pieces": [decode([i]) for i in results["digits"]["ids"]],
            "results": results,
        }
        comparison_text = "The tokenizer sees 123456."
        comparison_ids = encode(comparison_text)
        comparison_pieces = [decode([identifier]) for identifier in comparison_ids]
        assert "".join(comparison_pieces) == comparison_text
        assert decode(comparison_ids) == comparison_text
        record["comparison_trace"] = {
            "measured_on": "2026-10-16",
            "scope": "Shared presentation sentence; ordinary text without boundary insertion, chat, or media.",
            "input": comparison_text,
            "pieces": comparison_pieces,
            "ids": comparison_ids,
            "decoded": decode(comparison_ids),
        }
        if not is_kimi:
            probes = {}
            for text in ["hello world", "hello world!", "123456789"]:
                normalized = tokenizer.normalizer.normalize_str(text) if tokenizer.normalizer else text
                regions = [normalized[start:end] for _, (start, end) in tokenizer.pre_tokenizer.pre_tokenize_str(normalized)]
                assert "".join(regions) == normalized
                probes[text] = regions
            record["pretokenization_probes"] = probes
        if name == "Qwen3.8-27B":
            assert set(artifact["model"]["vocab"].values()) == set(range(model_entries))
            added_examples = []
            for spelling in ["<|im_start|>", "<|im_end|>", "<think>", "</think>"]:
                entry = next(token for token in artifact["added_tokens"] if token["content"] == spelling)
                assert encode(spelling) == [entry["id"]]
                assert decode([entry["id"]]) == spelling
                added_examples.append({"content": spelling, "id": entry["id"], "special": entry["special"]})
            assert {token["id"] for token in artifact["added_tokens"]} == set(range(model_entries, effective_ids))
            record["inventory_extension"] = {
                "base_id_range": [0, model_entries - 1],
                "added_count": len(artifact["added_tokens"]),
                "added_id_range": [model_entries, effective_ids - 1],
                "examples": added_examples,
                "allocated_without_tokenizer_id": record["embedding_rows"] - effective_ids,
                "unassigned_row_range": [effective_ids, record["embedding_rows"] - 1],
                "weight_values_inspected": False,
            }
            original = "Cafe\u0301 prices change."
            normalized = tokenizer.normalizer.normalize_str(original)
            pre_regions = [normalized[start:end] for _, (start, end) in tokenizer.pre_tokenizer.pre_tokenize_str(normalized)]
            ids = encode(original)
            pieces = [decode([identifier]) for identifier in ids]
            assert normalized == "Café prices change."
            assert "".join(pre_regions) == normalized
            assert "".join(pieces) == normalized
            assert ids == encode(normalized) == [34, 2492, 933, 7336, 2222, 13]
            assert decode(ids) == normalized
            record["opening_trace"] = {
                "measured_on": "2026-10-16",
                "scope": "Presentation trace; ordinary text without boundary insertion, chat, or media.",
                "input": original, "normalized": normalized,
                "pre_regions": pre_regions, "pieces": pieces,
                "ids": ids, "decoded": decode(ids),
            }
        if is_kimi:
            # Probe the two reviewed encoding branches, not the full remote
            # XTML formatter. Identical spelling must preserve content/control
            # provenance rather than re-tokenizing one concatenated string.
            marker = "<|end_of_msg|>"
            structural = tokenizer.encode(marker, allowed_special="all")
            literal = tokenizer.encode_ordinary(marker)
            assert structural == [163586]
            assert 163586 not in literal and tokenizer.decode(literal) == marker
            record["control_probe"] = {
                "scope": "Structural-marker versus ordinary-content encoding branches; not a full chat or media audit.",
                "marker": marker, "reserved_id": 163586,
                "structural_ids": structural, "literal_content_ids": literal,
            }
        report["models"].append(record)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=ROOT / ".tools/lecture6-tokenizers")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = audit(args.cache)
    if args.check:
        assert result == json.loads(SNAPSHOT.read_text()), "Audit differs from checked-in snapshot"
        print("PASS: four pinned tokenizers, nine fixtures each, exact IDs and round-trip contracts")
    elif args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
        print(f"Generated {args.output}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
