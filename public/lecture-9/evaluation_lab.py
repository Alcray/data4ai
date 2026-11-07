"""Lecture 9: saved-response evaluation and statistical checks.

Run: python3 evaluation_lab.py
Only the Python standard library is required. All data is constructed.
"""
import json
import math
import random
from collections import defaultdict
from statistics import mean, stdev


PASSAGES = {
    "retry": "Three total attempts include the initial request.",
    "memory": "The memory allocation is eight GiB.",
    "timeout": "The default timeout is thirty seconds.",
    "workers": "The service starts four workers.",
    "ports": "The service listens on port 8080.",
}
TASKS = [
    {"id": "retry-en", "family": "retry", "language": "en",
     "answer": 2, "unit": "retries", "support": ["retry"]},
    {"id": "retry-hy", "family": "retry", "language": "hy",
     "answer": 2, "unit": "retries", "support": ["retry"]},
    {"id": "memory-en", "family": "memory", "language": "en",
     "answer": 8, "unit": "GiB", "support": ["memory"]},
    {"id": "memory-hy", "family": "memory", "language": "hy",
     "answer": 8, "unit": "GiB", "support": ["memory"]},
    {"id": "timeout", "family": "timeout", "language": "en",
     "answer": 30, "unit": "seconds", "support": ["timeout"]},
    {"id": "workers", "family": "workers", "language": "en",
     "answer": 4, "unit": "workers", "support": ["workers"]},
    {"id": "ports", "family": "ports", "language": "en",
     "answer": 8080, "unit": "port", "support": ["ports"]},
    {"id": "unknown", "family": "unknown", "language": "hy",
     "answer": None, "unit": None, "support": []},
]


def response(answer, unit, citation):
    return json.dumps({"answer": answer, "unit": unit, "citation": citation})


def reject_constant(value):
    raise ValueError("Nonstandard JSON numeric constant: " + value)


def grade(task, raw):
    try:
        parsed = json.loads(raw, parse_constant=reject_constant)
    except (ValueError, TypeError):
        return "parse_error"
    if not isinstance(parsed, dict):
        return "schema_error"
    if parsed.get("abstain") is True:
        return "success" if task["answer"] is None else "unnecessary_abstention"
    if task["answer"] is None:
        return "unanswerable_but_answered"
    value = parsed.get("answer")
    if (type(value) not in (int, float) or not math.isfinite(value)
            or not isinstance(parsed.get("unit"), str)
            or not isinstance(parsed.get("citation"), str)):
        return "schema_error"
    if value != task["answer"]:
        return "wrong_value"
    if parsed["unit"] != task["unit"]:
        return "wrong_unit"
    if parsed["citation"] not in PASSAGES:
        return "unknown_citation"
    # An authored support map for these finite examples, not an entailment model.
    if parsed["citation"] not in task["support"]:
        return "unsupported_citation"
    return "success"


def evaluate(tasks, responses):
    ids = [task["id"] for task in tasks]
    if not ids or len(ids) != len(set(ids)):
        raise ValueError("Need nonempty tasks with unique identifiers")
    by_id = {}
    for record in responses:
        task_id = record["task_id"]
        if task_id not in ids or task_id in by_id:
            raise ValueError("Unknown or duplicate response identifier")
        by_id[task_id] = record
    results = []
    for task in tasks:
        record = by_id.get(task["id"])
        if record is None:
            status = "missing_response"
        elif record.get("status") == "tool_timeout":
            status = "tool_timeout"
        else:
            status = grade(task, record.get("raw"))
        results.append({"id": task["id"], "family": task["family"],
                        "language": task["language"], "status": status,
                        "success": int(status == "success")})
    return results


def pass_at_k(n, correct, k):
    if (any(type(value) is not int for value in (n, correct, k))
            or not 0 <= correct <= n or not 1 <= k <= n):
        raise ValueError("Require integer 0 <= correct <= n and 1 <= k <= n")
    if n - correct < k:
        return 1.0
    return 1 - math.prod((n - correct - j) / (n - j) for j in range(k))


def paired_statistics(a, b):
    if len(a) != len(b) or len(a) < 2:
        raise ValueError("Need at least two matched pairs")
    if any(value not in (0, 1) for value in a + b):
        raise ValueError("Outcomes must be binary")
    differences = [right - left for left, right in zip(a, b)]
    estimate = mean(differences)
    se = stdev(differences) / math.sqrt(len(differences))
    return estimate, se, (estimate - 1.96 * se, estimate + 1.96 * se)


def family_bootstrap(a_results, b_results, seed=7, repeats=5000):
    a_map = {row["id"]: row for row in a_results}
    b_map = {row["id"]: row for row in b_results}
    if (len(a_map) != len(a_results) or len(b_map) != len(b_results)
            or a_map.keys() != b_map.keys()):
        raise ValueError("Results must contain unique matched task IDs")
    groups = defaultdict(list)
    for task_id, left in a_map.items():
        right = b_map[task_id]
        if left["family"] != right["family"]:
            raise ValueError("Family identity changed between systems")
        groups[left["family"]].append(right["success"] - left["success"])
    differences = [mean(groups[name]) for name in sorted(groups)]
    if len(differences) < 2 or repeats < 2:
        raise ValueError("Need at least two families and bootstrap replicates")
    rng = random.Random(seed)
    draws = sorted(mean(rng.choices(differences, k=len(differences)))
                   for _ in range(repeats))
    return {"estimand": "equal-family mean difference",
            "families": len(differences), "estimate": mean(differences),
            "percentile_95_interval": [draws[int(.025 * (repeats - 1))],
                                       draws[int(.975 * (repeats - 1))]]}


def run_checks():
    # A missing response and a tool timeout both remain in the denominator.
    a = [
        {"task_id": "retry-en", "raw": response(3, "retries", "retry")},
        {"task_id": "retry-hy", "raw": response(3, "retries", "retry")},
        {"task_id": "memory-en", "raw": response(8, "GiB", "memory")},
        {"task_id": "memory-hy", "raw": response(8, "GB", "memory")},
        {"task_id": "timeout", "raw": "thirty seconds"},
        {"task_id": "workers", "raw": response(4, "workers", "workers")},
        {"task_id": "unknown", "raw": '{"abstain": true}'},
    ]
    b = [
        {"task_id": "retry-en", "raw": response(2, "retries", "retry")},
        {"task_id": "retry-hy", "raw": response(2, "retries", "retry")},
        {"task_id": "memory-en", "raw": response(8, "GiB", "memory")},
        {"task_id": "memory-hy", "raw": response(8, "GiB", "memory")},
        {"task_id": "timeout", "status": "tool_timeout"},
        {"task_id": "workers", "raw": response(4, "workers", "retry")},
        {"task_id": "ports", "raw": response(8080, "port", "ports")},
        {"task_id": "unknown", "raw": '{"abstain": true}'},
    ]
    a_results, b_results = evaluate(TASKS, a), evaluate(TASKS, b)
    assert len(a_results) == len(b_results) == 8
    assert sum(row["success"] for row in a_results) == 3
    assert sum(row["success"] for row in b_results) == 6
    assert a_results[6]["status"] == "missing_response"
    assert b_results[4]["status"] == "tool_timeout"
    assert b_results[5]["status"] == "unsupported_citation"
    assert grade(TASKS[0], response(True, "retries", "retry")) == "schema_error"
    assert grade(TASKS[0], response(2, "retries", "unknown")) == "unknown_citation"
    assert grade(TASKS[0], '{"answer": NaN}') == "parse_error"
    assert grade(TASKS[0], response(1e309, "retries", "retry")) == "parse_error"
    assert grade(TASKS[0], "[]") == "schema_error"
    assert grade(TASKS[0], '{"abstain": true}') == "unnecessary_abstention"
    for malformed in ([a[0], a[0]], [{"task_id": "absent", "raw": "{}"}]):
        try:
            evaluate(TASKS, malformed)
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid response alignment accepted")
    # Compare the product implementation with independent exact counting.
    for n in range(1, 15):
        for correct in range(n + 1):
            for k in range(1, n + 1):
                exact = 1 - math.comb(n - correct, k) / math.comb(n, k)
                assert math.isclose(pass_at_k(n, correct, k), exact, abs_tol=1e-12)
    assert math.isclose(pass_at_k(10, 3, 2), 8 / 15)
    try:
        pass_at_k(2, 1, 3)
    except ValueError:
        pass
    else:
        raise AssertionError("Out-of-range k accepted")
    pairs = [(1, 1)] * 60 + [(1, 0)] * 10 + [(0, 1)] * 14 + [(0, 0)] * 16
    estimate, se, interval = paired_statistics(
        [left for left, _ in pairs], [right for _, right in pairs])
    assert math.isclose(estimate, .04)
    assert math.isclose(se, math.sqrt((24 - 100 * .04 ** 2) / (99 * 100)),
                        abs_tol=1e-12)
    assert math.isclose(((.9 - 1) ** 2 + (.6 - 0) ** 2) / 2, .185)
    assert math.exp(60 / 25) > math.exp(65 / 50)
    assert 60 / (100 * math.log(2)) < 65 / (100 * math.log(2))
    assert math.ceil(1.96 ** 2 * .25 / .05 ** 2) == 385
    bound = 1 - .05 ** (1 / 100)
    assert math.isclose(bound, .029513049607039932)
    bootstrap = family_bootstrap(a_results, b_results)
    assert bootstrap["families"] == 6
    # Request weighting gives 3/8; equal family weighting gives 1/4.
    assert math.isclose(bootstrap["estimate"], .25)
    assert bootstrap == family_bootstrap(a_results, b_results)
    return {"tasks": 8, "independent_families": 6,
            "system_a_success": 3 / 8, "system_b_success": 6 / 8,
            "paired_family_bootstrap": bootstrap,
            "constructed_100_task_comparison": {
                "difference": estimate, "standard_error": se, "interval": interval},
            "pass_at_2_example": pass_at_k(10, 3, 2),
            "zero_failure_100_trial_upper_bound": bound,
            "checks": "pass"}


if __name__ == "__main__":
    print(json.dumps(run_checks(), indent=2))
