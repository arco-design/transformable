import solveCubicBezier from './_solveCubicBezier';
import getCubicBezierVByT from './_getCubicBezierVByT';

export function getCubicBezierPoint (cubic, p, axis = 'x') {
    const [x1, y1, x2, y2] = cubic;
    const t = p === 0 ? 0 : p === 1 ? 1 : axis === 'x' ? solveCubicBezier(p, x1, x2) : axis === 'y' ? solveCubicBezier(p, y1, y2) : p;
    return [
        axis === 'x' ? p : getCubicBezierVByT(x1, x2, t),
        axis === 'y' ? p : getCubicBezierVByT(y1, y2, t),
    ];
}