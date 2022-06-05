export default function getCubicBezierVbyT(v1, v2, t) {
    return 3 * v1 * t * (1-t) ** 2 + 3 * v2 * (1-t) * (t ** 2) + (t ** 3);
}