import {  FRAME_SPAN } from '../constant';
/* global window */
/* global clearTimeout */
export function _caf(cb) {
    return window.requestAnimationFrame ? window.cancelAnimationFrame(cb) : clearTimeout(cb, FRAME_SPAN);
}