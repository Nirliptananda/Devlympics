"""Tiny, dependency-free similarity helpers shared by all apps."""
import math


def cosine(a: dict, b: dict, keys) -> float:
    """Cosine similarity of two dicts over a fixed key list (0.0 if either is empty)."""
    va = [float(a.get(k, 0)) for k in keys]
    vb = [float(b.get(k, 0)) for k in keys]
    na = math.sqrt(sum(x * x for x in va))
    nb = math.sqrt(sum(x * x for x in vb))
    if na == 0 or nb == 0:
        return 0.0
    return sum(x * y for x, y in zip(va, vb)) / (na * nb)


def jaccard(a: set, b: set) -> float:
    """Overlap divided by union (0.0 when both sets are empty)."""
    union = a | b
    return len(a & b) / len(union) if union else 0.0
