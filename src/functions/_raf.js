import { FRAME_SPAN } from '../constant';
/* global window */
/* global setTimeout */
export function _raf(cb) {
    return window.requestAnimationFrame ? window.requestAnimationFrame(cb) : setTimeout(cb, FRAME_SPAN);
}