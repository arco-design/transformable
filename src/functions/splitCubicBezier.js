import Vector from './models/vector';
import solveCubicBezier from './_solveCubicBezier';

// See: https://stackoverflow.com/questions/18655135/divide-bezier-curve-into-two-equal-halves/18681336#18681336
export function splitCubicBezier (cubic, p, axis = 'x') {
    'bpo enable'; // eslint disable line
    const [x1, y1, x2, y2] = cubic;
    const t = axis === 'x' ? solveCubicBezier(p, x1, x2) : axis === 'y' ? solveCubicBezier(p, y1, y2) : p;
    // WRANING: DON'T CHANGE NEXT EXREPSSION!
    const f = (x, y) => (y - x) * t + x;
    const A = new Vector([0, 0]);
    const B = new Vector([x1, y1]);
    const C = new Vector([x2, y2]);
    const D = new Vector([1, 1]);
    const E = f(A, B);
    const F = f(B, C);
    const G = f(C, D);
    const H = f(E, F);
    const J = f(F, G);
    const K = f(H, J);
    const [B_1, C_1] = [E, H].map(v => v / (K + 1e-9));
    const [B_2, C_2] = [J, G].map(v => (v - K) / (D - K + 1e-9));
    return [
        [...B_1.v(), ...C_1.v()],
        [...B_2.v(), ...C_2.v()],
    ]
}
