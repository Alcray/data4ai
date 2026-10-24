"""Regression checks for the constructed Lecture 7 numerical examples."""

import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "lecture7-mixture-examples.py"
SPEC = importlib.util.spec_from_file_location("lecture7_examples", SCRIPT)
EXAMPLES = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXAMPLES)


class MixtureExamplesTest(unittest.TestCase):
    def assertVectorAlmostEqual(self, actual, expected, places=12):
        self.assertEqual(len(actual), len(expected))
        for left, right in zip(actual, expected):
            self.assertAlmostEqual(left, right, places=places)

    def test_record_target_conversion(self):
        self.assertVectorAlmostEqual(EXAMPLES.target_shares([0.9, 0.1], [100, 1000]), [9 / 19, 10 / 19])
        q = EXAMPLES.record_probs_for_targets([0.9, 0.1], [100, 1000])
        self.assertVectorAlmostEqual(q, [90 / 91, 1 / 91])
        self.assertVectorAlmostEqual(EXAMPLES.target_shares(q, [100, 1000]), [0.9, 0.1])

    def test_weights_need_not_already_sum_to_one(self):
        self.assertVectorAlmostEqual(EXAMPLES.target_shares([9, 1], [100, 1000]), [9 / 19, 10 / 19])
        self.assertVectorAlmostEqual(EXAMPLES.record_probs_for_targets([9, 1], [100, 1000]), [90 / 91, 1 / 91])

    def test_zero_source_weights_remain_zero(self):
        self.assertVectorAlmostEqual(EXAMPLES.target_shares([0, 1], [100, 1000]), [0, 1])
        self.assertVectorAlmostEqual(EXAMPLES.record_probs_for_targets([0, 1], [100, 1000]), [0, 1])

    def test_conversions_reject_invalid_inputs(self):
        for function in (EXAMPLES.record_probs_for_targets, EXAMPLES.target_shares):
            for weights, lengths in (([], []), ([0, 0], [1, 2]), ([-1, 2], [1, 2]), ([1], [0]), ([1], [-1]), ([1, 1], [1]), ([math.nan], [1]), ([math.inf], [1]), ([1], [math.nan]), ([1], [math.inf]), ([True], [1])):
                with self.subTest(function=function.__name__, weights=weights, lengths=lengths):
                    with self.assertRaises(ValueError):
                        function(weights, lengths)

    def test_expected_unique_formula_and_boundaries(self):
        self.assertAlmostEqual(EXAMPLES.expected_unique([0.001] * 1000, 1000), 632.304575229, places=8)
        self.assertEqual(EXAMPLES.expected_unique([1, 0], 100), 1)
        self.assertEqual(EXAMPLES.expected_unique([0.5, 0.5], 0), 0)
        self.assertEqual(EXAMPLES.expected_unique([0.5, 0.5], 1), 1)
        self.assertAlmostEqual(EXAMPLES.expected_unique([0.9, 0.1], 2), 1.18)

    def test_expected_unique_rejects_invalid_distribution_and_draw_count(self):
        for probabilities, n in (([], 1), ([0, 0], 1), ([0.3, 0.3], 1), ([-0.1, 1.1], 1), ([math.nan], 1), ([math.inf], 1), ([1], -1), ([1], 1.5), ([1], True)):
            with self.subTest(probabilities=probabilities, n=n):
                with self.assertRaises(ValueError):
                    EXAMPLES.expected_unique(probabilities, n)

    def test_running_example_repetition_cap(self):
        caps = [4, 0.6, 0.04, 0.3, 0.5]
        result = EXAMPLES.capped_mixture([0.5, 0.18, 0.10, 0.12, 0.10], caps)
        self.assertVectorAlmostEqual(result, [8 / 15, 0.192, 0.04, 0.128, 8 / 75])
        self.assertAlmostEqual(sum(result), 1)
        for value, cap in zip(result, caps):
            self.assertLessEqual(value, cap)

    def test_caps_can_saturate_more_than_one_source(self):
        result = EXAMPLES.capped_mixture([0.8, 0.15, 0.05], [0.2, 0.3, 0.8])
        self.assertVectorAlmostEqual(result, [0.2, 0.3, 0.5])
        self.assertVectorAlmostEqual(EXAMPLES.capped_mixture([1, 1], [0.5, 0.5]), [0.5, 0.5])

    def test_caps_preserve_base_support(self):
        self.assertVectorAlmostEqual(EXAMPLES.capped_mixture([0, 1], [1, 1]), [0, 1])
        self.assertVectorAlmostEqual(EXAMPLES.capped_mixture([1, 1], [0, 1]), [0, 1])
        with self.assertRaises(ValueError):
            EXAMPLES.capped_mixture([1, 0], [0.8, 1])

    def test_caps_retain_tiny_positive_support_after_larger_source_is_capped(self):
        self.assertVectorAlmostEqual(EXAMPLES.capped_mixture([1e308, 1e-308], [0, 2]), [0, 1])
        self.assertVectorAlmostEqual(EXAMPLES.capped_mixture([1e308, 1e-308], [0.5, 2]), [0.5, 0.5])

    def test_caps_reject_infeasible_and_invalid_inputs(self):
        for base, caps in (([], []), ([0, 0], [1, 1]), ([1], [0.9]), ([1, 1], [0.2, 0.3]), ([1], []), ([-1], [1]), ([1], [-1]), ([math.nan], [1]), ([1], [math.inf])):
            with self.subTest(base=base, caps=caps):
                with self.assertRaises(ValueError):
                    EXAMPLES.capped_mixture(base, caps)

    def test_smoothing_endpoints_and_nonempty_support(self):
        self.assertVectorAlmostEqual(EXAMPLES.smoothed_multilingual([99, 1], 1), [0.99, 0.01])
        self.assertVectorAlmostEqual(EXAMPLES.smoothed_multilingual([99, 1], 0), [0.5, 0.5])
        self.assertVectorAlmostEqual(EXAMPLES.smoothed_multilingual([0, 99, 1], 0), [0, 0.5, 0.5])
        armenian = 1 / (math.sqrt(99) + 1)
        self.assertVectorAlmostEqual(EXAMPLES.smoothed_multilingual([99, 1]), [1 - armenian, armenian])

    def test_smoothing_rejects_invalid_inputs(self):
        for sizes, alpha in (([], 0.5), ([0, 0], 0.5), ([-1, 2], 0.5), ([math.nan], 0.5), ([1], -0.1), ([1], 1.1), ([1], math.inf)):
            with self.subTest(sizes=sizes, alpha=alpha):
                with self.assertRaises(ValueError):
                    EXAMPLES.smoothed_multilingual(sizes, alpha)

    def test_doremi_clips_tokens_before_domain_mean(self):
        result = EXAMPLES.doremi_update([0.5, 0.5], [[2, 4], [8, 10]], [[1, 5], [8, 10]])
        expected_a = 0.999 / (1 + math.exp(-0.5)) + 0.0005
        self.assertVectorAlmostEqual(result, [expected_a, 1 - expected_a])
        self.assertAlmostEqual(result[0], 0.6223368718706527)
        # Clipping AFTER the mean would incorrectly give equal weights here.
        self.assertGreater(result[0], 0.6)

    def test_doremi_stable_exponential_and_uniform_smoothing(self):
        result = EXAMPLES.doremi_update([0.5, 0.5], [[10000], [0]], [[0], [0]])
        self.assertVectorAlmostEqual(result, [0.9995, 0.0005])
        self.assertVectorAlmostEqual(EXAMPLES.doremi_update([0, 1], [[10000], [0]], [[0], [0]]), [0.0005, 0.9995])
        self.assertVectorAlmostEqual(EXAMPLES.doremi_update([0.1, 0.9], [[1], [2]], [[0], [0]], c=1), [0.5, 0.5])
        self.assertVectorAlmostEqual(EXAMPLES.doremi_update([0.1, 0.9], [[1], [2]], [[0], [0]], eta=0, c=0), [0.1, 0.9])

    def test_doremi_rejects_invalid_inputs(self):
        fixtures = (([], [], [], {}), ([0, 0], [[1], [1]], [[1], [1]], {}), ([1], [], [], {}), ([1], [[1, 2]], [[1]], {}), ([1], [[]], [[]], {}), ([1], [[math.nan]], [[1]], {}), ([1], [[1]], [[math.inf]], {}), ([1], [[-1]], [[1]], {}), ([1], [[1]], [[1]], {"eta": -1}), ([1], [[1]], [[1]], {"eta": math.nan}), ([1], [[1]], [[1]], {"c": -1}), ([1], [[1]], [[1]], {"c": 1.1}))
        for previous, proxy, reference, options in fixtures:
            with self.subTest(previous=previous, proxy=proxy, options=options):
                with self.assertRaises(ValueError):
                    EXAMPLES.doremi_update(previous, proxy, reference, **options)

    def test_raw_unit_scaling_optimum(self):
        parameters, tokens = EXAMPLES.scaling_optimum(1e8, 2e9, 1, 1, 1.2e18)
        self.assertAlmostEqual(parameters / 1e8, 1)
        self.assertAlmostEqual(tokens / 2e9, 1)
        self.assertAlmostEqual(6 * parameters * tokens / 1.2e18, 1)
        for factor in (0.25, 0.5, 2, 4):
            candidate_p = parameters * factor
            candidate_t = 1.2e18 / (6 * candidate_p)
            optimum_loss = 1e8 / parameters + 2e9 / tokens
            self.assertGreater(1e8 / candidate_p + 2e9 / candidate_t, optimum_loss)

    def test_scaling_exponents_and_first_order_balance(self):
        A, B, a, b, C = 2e6, 2e8, 0.6, 0.4, 1.2e18
        p1, t1 = EXAMPLES.scaling_optimum(A, B, a, b, C)
        p2, t2 = EXAMPLES.scaling_optimum(A, B, a, b, C * 16)
        self.assertAlmostEqual(p2 / p1, 16 ** (b / (a + b)))
        self.assertAlmostEqual(t2 / t1, 16 ** (a / (a + b)))
        self.assertAlmostEqual(a * A * p1 ** -a / (b * B * t1 ** -b), 1)

    def test_scaling_rejects_nonpositive_and_nonfinite_inputs(self):
        for index in range(6):
            for value in (0, -1, math.nan, math.inf, True):
                inputs = [1e8, 2e9, 1, 1, 1.2e18, 6]
                inputs[index] = value
                with self.subTest(index=index, value=value):
                    with self.assertRaises(ValueError):
                        EXAMPLES.scaling_optimum(*inputs)

    def test_curriculum_order_changes_the_final_scalar(self):
        traces = EXAMPLES.two_stage_sgd()
        self.assertVectorAlmostEqual(traces["A_then_B"], [0, 0.1, -0.01])
        self.assertVectorAlmostEqual(traces["B_then_A"], [0, -0.1, 0.01])

    def test_constructed_proxy_response_and_interior_minimum(self):
        loss = lambda z: 2.4 - 0.6 * z + 0.8 * z * z
        for z, expected in ((0, 2.4), (0.25, 2.3), (0.5, 2.3), (0.75, 2.4), (1, 2.6), (0.375, 2.2875)):
            self.assertAlmostEqual(loss(z), expected)
        self.assertLess(loss(0.375), min(loss(z) for z in (0, 0.5, 1)))

    def test_quota_fixture_matches_target_shares_not_record_shares(self):
        target = [0.5, 0.5]
        consumed, lengths, chosen = [0, 0], [2, 6], []
        for _ in range(4):
            total = sum(consumed)
            source = max(range(2), key=lambda i: target[i] * total - consumed[i])
            chosen.append(source)
            consumed[source] += lengths[source]
        self.assertEqual(chosen, [0, 1, 0, 0])
        self.assertEqual(consumed, [6, 6])

    def test_curriculum_rejects_invalid_inputs(self):
        for options in ({"eta": 0}, {"eta": -1}, {"eta": math.inf}, {"initial": math.nan}):
            with self.subTest(options=options):
                with self.assertRaises(ValueError):
                    EXAMPLES.two_stage_sgd(**options)

    def test_cli_prints_finite_json_examples(self):
        completed = subprocess.run([sys.executable, str(SCRIPT)], check=True, text=True, capture_output=True)
        data = json.loads(completed.stdout)
        self.assertEqual(data["repetition_cap"]["share_caps"], [4, 0.6, 0.04, 0.3, 0.5])
        self.assertVectorAlmostEqual(data["repetition_cap"]["capped"], [8 / 15, 0.192, 0.04, 0.128, 8 / 75])
        self.assertAlmostEqual(data["curriculum_order"]["A_then_B"][-1], -0.01)


if __name__ == "__main__":
    unittest.main()
