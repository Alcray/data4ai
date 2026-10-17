"""Offline-after-cache checks for the pinned text-format fixtures."""
import json
from pathlib import Path
import runpy
import unittest

ROOT = Path(__file__).resolve().parents[1]
AUDIT = runpy.run_path(str(ROOT / "scripts/audit-lecture6-chat-controls.py"))
FIXTURE = json.loads((ROOT / "content/fixtures/lecture6-chat-controls.json").read_text())
MODELS = {model["name"]: model for model in FIXTURE["models"]}


class ChatFormatTests(unittest.TestCase):
    def test_full_snapshot_reproduces(self):
        self.assertEqual(AUDIT["audit"](), FIXTURE)

    def test_same_messages_and_explicit_scope(self):
        self.assertEqual([message["role"] for message in FIXTURE["messages"]], ["system", "user", "assistant"])
        self.assertEqual([message["content"] for message in FIXTURE["messages"]], ["Be concise.", "Hello", "Hi."])
        self.assertIn("no model generation", FIXTURE["scope"])
        self.assertIn("remote Python execution", FIXTURE["scope"])

    def test_display_breaks_do_not_modify_serialized_bytes(self):
        for model in MODELS.values():
            with self.subTest(model=model["name"]):
                self.assertEqual("".join(model["display_parts"]), model["serialized"])
                self.assertEqual("\n\n".join(part.replace("\n", "\\n") for part in model["display_parts"]), model["display_code"])

    def test_qwen_empty_thinking_and_function_syntax(self):
        qwen = MODELS["Qwen3.8-27B"]
        self.assertIn("<|im_start|>system\nBe concise.<|im_end|>", qwen["serialized"])
        self.assertIn("<think>\n\n</think>\n\nHi.", qwen["serialized"])
        self.assertEqual(qwen["tool_call"], "<tool_call>\n<function=clock>\n</function>\n</tool_call>")
        self.assertTrue(qwen["tool_result"].startswith("<|im_start|>user\n<tool_response>"))

    def test_deepseek_chat_transition_and_dsml(self):
        deepseek = MODELS["DeepSeek-V4-Pro"]
        self.assertEqual(deepseek["serialized"], "<｜begin▁of▁sentence｜>Be concise.<｜User｜>Hello<｜Assistant｜></think>Hi.<｜end▁of▁sentence｜>")
        self.assertIn('<｜DSML｜invoke name="clock">', deepseek["tool_call"])
        self.assertTrue(deepseek["tool_call"].startswith("<｜DSML｜tool_calls>"))
        self.assertEqual(deepseek["tool_result"], "<｜User｜><tool_result>12:00</tool_result>")
        self.assertIn("not publisher Python execution", deepseek["verification"])

    def test_glm_system_injection_and_observation(self):
        glm = MODELS["GLM-5.3"]
        self.assertTrue(glm["serialized"].startswith("[gMASK]<sop><|system|>Reasoning Effort: Max"))
        self.assertEqual(glm["tool_call"], "<tool_call>clock</tool_call>")
        self.assertEqual(glm["tool_result"], "<|observation|><tool_response>12:00</tool_response>")

    def test_kimi_xtml_keeps_channels_and_tools_structured(self):
        kimi = MODELS["Kimi-K3"]
        self.assertEqual(kimi["thinking_open"], "<|open|>think<|sep|>")
        self.assertIn("<|open|>response<|sep|>Hi.<|close|>response<|sep|>", kimi["serialized"])
        self.assertIn('<|open|>call tool="clock" index="1"<|sep|>', kimi["tool_call"])
        self.assertIn('message role="tool" tool="clock" index="1"', kimi["tool_result"])
        self.assertIn("not publisher Python execution", kimi["verification"])

    def test_ast_reader_does_not_evaluate_arbitrary_expressions(self):
        result = AUDIT["literal_constants"]('SAFE="x"\nNEXT=SAFE+"y"\nDANGEROUS=__import__("os").getcwd()\n')
        self.assertEqual(result, {"SAFE": "x", "NEXT": "xy"})


if __name__ == "__main__":
    unittest.main()
