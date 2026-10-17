"""Executable normalization and segmentation fixtures from Lecture 6.

Run with the environment from scripts/requirements-lecture6-audit.txt:
  .tools/lecture6-audit-env/bin/python tests/lecture6-preprocessing.test.py
"""

import unicodedata as ud
import unittest

from tokenizers import Tokenizer, models


class NormalizationExamples(unittest.TestCase):
    def test_nfc_composes_canonical_equivalents(self):
        self.assertEqual(ud.normalize("NFC", "e\u0301"), "é")
        self.assertEqual(ud.normalize("NFC", "é"), "é")
        self.assertNotEqual(ud.normalize("NFC", "é"), "e")

    def test_canonical_ordering(self):
        self.assertGreater(ud.combining("\u0301"), ud.combining("\u0323"))
        self.assertEqual(ud.normalize("NFD", "a\u0301\u0323"), "a\u0323\u0301")

    def test_nfkc_compatibility_folding(self):
        for before, after in [("ａ", "a"), ("ﬃ", "ffi"), ("①", "1")]:
            self.assertEqual(ud.normalize("NFKC", before), after)
            self.assertEqual(ud.normalize("NFC", before), before)

    def test_nfkc_does_not_transliterate_cyrillic(self):
        self.assertEqual(ud.normalize("NFKC", "а"), "а")
        self.assertNotEqual(ud.normalize("NFKC", "а"), "a")

    def test_lowercasing_is_separate_and_lossy(self):
        for before, after in [("HELLO", "hello"), ("Հայերեն", "հայերեն"), ("US", "us")]:
            self.assertEqual(before.lower(), after)
            self.assertEqual(ud.normalize("NFKC", before), before)
        self.assertEqual("ß".lower(), "ß")
        self.assertEqual("ß".casefold(), "ss")

    def test_armenian_unicode_and_custom_rules_differ(self):
        self.assertEqual("եվ".replace("եվ", "և"), "և")
        self.assertEqual(ud.normalize("NFC", "և"), "և")
        self.assertEqual(ud.normalize("NFKC", "և"), "եւ")
        self.assertNotEqual("եւ", "եվ")

    def test_custom_rule_order_matters(self):
        text = "ԲԱՐԵՎ"
        self.assertEqual(text.lower().replace("եվ", "և"), "բարև")
        self.assertEqual(text.replace("եվ", "և").lower(), "բարեվ")
        self.assertEqual(ud.normalize("NFKC", text.lower().replace("եվ", "և")), "բարեւ")

    def test_number_verbalization_is_not_unicode_normalization(self):
        def english_fixture(text):
            return "seven" if text == "7" else text

        self.assertEqual(english_fixture("7"), "seven")
        self.assertEqual(english_fixture("17"), "17")
        self.assertEqual(english_fixture("v7"), "v7")
        for form in ["NFC", "NFKC"]:
            self.assertEqual(ud.normalize(form, "7"), "7")


class SegmentationExamples(unittest.TestCase):
    def test_utf8_character_lengths(self):
        for character, hex_bytes in [("A", "41"), ("Я", "D0 AF"), ("中", "E4 B8 AD")]:
            self.assertEqual(character.encode("utf-8"), bytes.fromhex(hex_bytes))
        self.assertEqual([len(c.encode("utf-8")) for c in ["A", "Я", "中", "𠀀"]], [1, 2, 3, 4])
        self.assertEqual(len("é".encode("utf-8")), 2)

    def test_byte_bpe_one_merge(self):
        raw = "café".encode("utf-8")
        self.assertEqual(raw.hex(" "), "63 61 66 c3 a9")
        self.assertEqual(list(raw), [99, 97, 102, 195, 169])
        pieces = [b"c", b"a", b"f", bytes([195, 169])]
        self.assertEqual([piece.decode("utf-8") for piece in pieces], ["c", "a", "f", "é"])
        self.assertEqual(b"".join(pieces).decode("utf-8"), "café")
        with self.assertRaises(UnicodeDecodeError):
            bytes([195]).decode("utf-8")

    def test_wordpiece_greedy_success_and_whole_word_failure(self):
        vocab = {"[UNK]": 0, "play": 1, "##ing": 2, "p": 3, "##layer": 4}
        tokenizer = Tokenizer(models.WordPiece(vocab=vocab, unk_token="[UNK]"))
        self.assertEqual(tokenizer.encode("playing", add_special_tokens=False).tokens, ["play", "##ing"])
        self.assertEqual(tokenizer.encode("player", add_special_tokens=False).tokens, ["[UNK]"])
        self.assertIn("p", vocab)
        self.assertIn("##layer", vocab)


if __name__ == "__main__":
    unittest.main()
