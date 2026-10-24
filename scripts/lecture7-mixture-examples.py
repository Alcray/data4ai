#!/usr/bin/env python3
"""Small, dependency-free numerical examples for Lecture 7.

These functions illustrate sampling and planning; they are not a training loader
or a reproduction of an entire proxy-training algorithm. Run this file to print
the constructed classroom examples as JSON.
"""

import json
import math
from numbers import Real


def _number(value, name, *, minimum=None, positive=False):
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite number")
    value = float(value)
    if not math.isfinite(value):
        raise ValueError(f"{name} must be finite")
    if positive and value <= 0:
        raise ValueError(f"{name} must be positive")
    if minimum is not None and value < minimum:
        raise ValueError(f"{name} must be at least {minimum}")
    return value


def _vector(values, name, *, positive=False):
    result = [
        _number(value, name, minimum=0, positive=positive)
        for value in values
    ]
    if not result:
        raise ValueError(f"{name} must not be empty")
    return result


def _normalize(values):
    peak = max(values)
    if peak <= 0:
        raise ValueError("weights must have positive total mass")
    scaled = [value / peak for value in values]
    total = math.fsum(scaled)
    return [value / total for value in scaled]


def _softmax(log_weights):
    peak = max(log_weights)
    if not math.isfinite(peak):
        raise ValueError("weights must have positive total mass")
    return _normalize([math.exp(value - peak) for value in log_weights])


def _paired_weights_and_lengths(weights, mean_targets):
    weights = _vector(weights, "weights")
    lengths = _vector(mean_targets, "mean targets", positive=True)
    if len(weights) != len(lengths):
        raise ValueError("weights and mean targets must have equal lengths")
    if not any(weights):
        raise ValueError("weights must have positive total mass")
    return weights, lengths


def record_probs_for_targets(target_weights, mean_targets):
    """Convert desired target shares to record probabilities: q_i ∝ p_i/μ_i."""
    weights, lengths = _paired_weights_and_lengths(target_weights, mean_targets)
    return _softmax([
        math.log(weight) - math.log(length) if weight else -math.inf
        for weight, length in zip(weights, lengths)
    ])


def target_shares(record_weights, mean_targets):
    """Long-run target shares for stable record lengths: p_i ∝ q_i μ_i."""
    weights, lengths = _paired_weights_and_lengths(record_weights, mean_targets)
    return _softmax([
        math.log(weight) + math.log(length) if weight else -math.inf
        for weight, length in zip(weights, lengths)
    ])


def expected_unique(probabilities, n):
    """Expected distinct items after n independent draws with replacement."""
    probs = _vector(probabilities, "probabilities")
    if any(value > 1 for value in probs) or not math.isclose(
        math.fsum(probs), 1.0, rel_tol=0, abs_tol=1e-12
    ):
        raise ValueError("probabilities must sum to one")
    if isinstance(n, bool) or not isinstance(n, int) or n < 0:
        raise ValueError("n must be a nonnegative integer")
    if n == 0:
        return 0.0
    return math.fsum(
        1.0 if probability == 1 else -math.expm1(n * math.log1p(-probability))
        for probability in probs
    )


def capped_mixture(base_weights, caps):
    """Proportionally redistribute mass subject to p_i=min(cap_i, λ base_i).

    Caps are target-share limits (and may exceed one). Zero base weights stay
    zero: capacity outside the base distribution's support cannot be used.
    """
    base = _vector(base_weights, "base weights")
    caps = _vector(caps, "caps")
    if len(base) != len(caps):
        raise ValueError("base weights and caps must have equal lengths")
    if not any(base):
        raise ValueError("weights must have positive total mass")
    active = {i for i, weight in enumerate(base) if weight > 0 and caps[i] > 0}
    capacity = math.fsum(min(caps[i], 1.0) for i in active)
    if capacity < 1.0:
        raise ValueError("caps are infeasible on the base weights' support")

    result = [0.0] * len(base)
    while active:
        remaining = 1.0 - math.fsum(result)
        peak = max(base[i] for i in active)
        total = math.fsum(base[i] / peak for i in active)
        proposed = {i: remaining * (base[i] / peak) / total for i in active}
        saturated = {i for i in active if proposed[i] > caps[i]}
        if not saturated:
            for i in active:
                result[i] = proposed[i]
            break
        for i in saturated:
            result[i] = caps[i]
        active -= saturated
    return result


def smoothed_multilingual(capacities, alpha=0.5):
    """Normalize D_i**alpha over nonempty pools, with alpha in [0, 1]."""
    capacities = _vector(capacities, "capacities")
    alpha = _number(alpha, "alpha", minimum=0)
    if alpha > 1:
        raise ValueError("alpha must be at most one")
    return _softmax([
        alpha * math.log(capacity) if capacity else -math.inf
        for capacity in capacities
    ])


def doremi_update(prev_weights, proxy_losses, reference_losses, eta=1, c=0.001):
    """One domain-weight update using paired token-level excess losses.

    Clip each proxy-minus-reference token loss at zero BEFORE taking its domain
    mean. Exponentiate the scores, normalize, then mix in c times uniform mass.
    This isolates the weight update; no proxy/reference model is trained here.
    """
    previous = _normalize(_vector(prev_weights, "previous weights"))
    eta = _number(eta, "eta", minimum=0)
    c = _number(c, "c", minimum=0)
    if c > 1:
        raise ValueError("c must be at most one")
    proxy_losses = list(proxy_losses)
    reference_losses = list(reference_losses)
    if not len(previous) == len(proxy_losses) == len(reference_losses):
        raise ValueError("each domain needs weights and paired loss lists")

    scores = []
    for proxy, reference in zip(proxy_losses, reference_losses):
        proxy = _vector(proxy, "proxy token losses")
        reference = _vector(reference, "reference token losses")
        if len(proxy) != len(reference):
            raise ValueError("paired token loss lists must have equal lengths")
        count = len(proxy)
        scores.append(math.fsum(
            max(0.0, left - right) / count
            for left, right in zip(proxy, reference)
        ))

    # Subtracting the largest supported score prevents positive exp overflow.
    largest = max(score for score, weight in zip(scores, previous) if weight > 0)
    updated = _softmax([
        math.log(weight) + eta * (score - largest) if weight else -math.inf
        for weight, score in zip(previous, scores)
    ])
    uniform = c / len(previous)
    return [(1.0 - c) * weight + uniform for weight in updated]


def scaling_optimum(A, B, a, b, C, k=6):
    """Return (P*, T*) for A P^-a + B T^-b subject to C=kPT.

    P and T use raw parameter/token counts, not millions/billions. The fitted
    loss coefficients must use those same units. This is an analytic model,
    not a claim that its parameters fit a particular real training run.
    """
    A, B, a, b, C, k = [
        _number(value, name, positive=True)
        for name, value in zip(("A", "B", "a", "b", "C", "k"), (A, B, a, b, C, k))
    ]
    log_budget = math.log(C) - math.log(k)
    log_parameters = (
        math.log(a) + math.log(A) - math.log(b) - math.log(B) + b * log_budget
    ) / (a + b)
    try:
        parameters = math.exp(log_parameters)
        tokens = math.exp(log_budget - log_parameters)
    except OverflowError as error:
        raise ValueError("optimum is outside representable floating-point range") from error
    if not (math.isfinite(parameters) and parameters > 0 and math.isfinite(tokens) and tokens > 0):
        raise ValueError("optimum is outside representable floating-point range")
    return parameters, tokens


def two_stage_sgd(eta=0.1, initial=0):
    """Compare A→B and B→A for losses (θ-1)^2/2 and (θ+1)^2/2."""
    eta = _number(eta, "eta", positive=True)
    initial = _number(initial, "initial")

    def trajectory(centers):
        theta = initial
        trace = [theta]
        for center in centers:
            theta -= eta * (theta - center)
            if not math.isfinite(theta):
                raise ValueError("trajectory is outside floating-point range")
            trace.append(theta)
        return trace

    return {"A_then_B": trajectory((1, -1)), "B_then_A": trajectory((-1, 1))}


def worked_examples():
    desired = [0.50, 0.18, 0.10, 0.12, 0.10]
    capacity_millions = [800, 120, 20, 60, 100]
    repeat_caps = [10, 10, 4, 10, 10]
    budget_millions = 2000
    caps = [repeat * capacity / budget_millions for repeat, capacity in zip(repeat_caps, capacity_millions)]
    capped = capped_mixture(desired, caps)
    parameters, tokens = scaling_optimum(1e8, 2e9, 1, 1, 1.2e18)
    return {
        "record_sampling": {
            "target_share_from_90_percent_short_records": target_shares([0.9, 0.1], [100, 1000]),
            "record_probabilities_for_90_percent_short_targets": record_probs_for_targets([0.9, 0.1], [100, 1000]),
        },
        "coverage": {"chunks": 1000, "draws": 1000, "expected_unique": expected_unique([0.001] * 1000, 1000)},
        "square_root_smoothing": smoothed_multilingual([99, 1]),
        "repetition_cap": {
            "capacity_millions": capacity_millions,
            "target_budget_millions": budget_millions,
            "desired": desired,
            "repeat_caps": repeat_caps,
            "share_caps": caps,
            "capped": capped,
            "exposure_ratios": [weight * budget_millions / capacity for weight, capacity in zip(capped, capacity_millions)],
        },
        "doremi_weight_update": {
            "clipped_token_excess_means": [0.5, 0.0],
            "new_weights": doremi_update([0.5, 0.5], [[2, 4], [8, 10]], [[1, 5], [8, 10]]),
        },
        "constructed_scaling_model": {"parameters": parameters, "tokens": tokens, "compute": 6 * parameters * tokens},
        "curriculum_order": two_stage_sgd(),
    }


if __name__ == "__main__":
    print(json.dumps(worked_examples(), indent=2, allow_nan=False))
