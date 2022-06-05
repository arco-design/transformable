import {
    DRAG_SWIPE_TIMEOUT,
    DRAG_SWIPE_BOUNCE_MIN_RATE,
    DRAG_SWIPE_BOUNCE_MAX_DIS,
    DRAG_MODE,
    SWIPE_MODE,
    TRANSFORM_MODE,
    FRAME_SPAN,
} from './constant';

import {
    _raf,
    _caf,
    getDistance,
    splitCubicBezier,
    getCubicBezierPoint,
} from './functions';

/* global document */
/* global window */
/* global console */
/* global setTimeout */
/* global clearTimeout */

export default class TransformAble {
    constructor(options = {}) {
        // public props

        // @{param} [dom: HTMLElement] transform target
        this.dom = null;
        // @{param} [useDomBoundary: boolean] decide how to compute target boundary for collision detection (inside edge):
        //     true: use ```dom.getBoundingClientRect``` when dom set
        //     false: manually set by ```this.setBoundary```
        // default as true if options.dom provided
        this.useDomBoundary = false;
        // @{param} [viewport: {[left|right|top|bottom]: number}] viewport scope for collision detection (outside edge):
        this.viewport = {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight,
        };

        // @{param} [maxScale: number] max scale limit, default as 2
        this.maxScale = 2;
        // @{param} [minScale: number] min scale limit, default as 0.5
        this.minScale = 0.5;
        // @{param} [fixedX: boolean] enable y-axis draggine only, default as false
        this.fixedX = false;
        // @{param} [fixedX: boolean] enable x-axis dragging only, default as false
        this.fixedY = false;
        // @{param} [active: boolean] active state, default as true, false = disabled
        this.active = true;
        // @{param} [preventScroll: boolean] triggle e.preventDefault since touch, in order to prevent scroll dom behavior, default as true
        this.preventScroll = true;
        // @{param} [dragmode: string eunm (always|hybrid|none)] 
        //     always: enable drag without scaling
        //     hybrid: enable drag only if scaled
        //     none: no drag
        //  default as 'hybrid'
        this.dragMode = DRAG_MODE.HYBRID;
        // @{param} [swipemode: string enum (animation|transition)] decide how to implement momentum-based scrolling animation
        //     animation: insert <style> css declaration when animation triggered
        //     transition: use transition ease function when animation triggered
        // default as 'anmation' for best performance
        this.swipeMode = SWIPE_MODE.ANIM;
        // @{param} [transformMode: string enum (translate-first|scale-first)] animation effect may be different when dragging & scaling both
        //     translate-first: set [transform] as 'translate()scale()'
        //     scale-first:  set [transform] as 'scale()translate()'
        //      
        //  default as 'translate-first'
        this.transformMode = TRANSFORM_MODE.TRANS_FIRST;
        // @{param} [transform: {[translateX|translateY|scale]: number}] initial transform state, default as translate(0,0)scale(1)
        this.transform = {};

        // event hooks

        // @{param} [onZoomStart: Function] scale touchStartEvent(>2 finger) hook
        this.onZoomStart = () => {};
        // @{param} [onZoomEnd: Function] scale touchEndEvent hook
        this.onZoomEnd = () => {};
        // @{param} [onDragStart: Function] drag touchStartEvent start hook
        this.onDragStart = () => {};
        // @{param} [onDragEnd: Function] drag touchEndEvent end hook
        this.onDragEnd = () => {};
        // @{param} [onSwipeEnd: Function] momentum-based scrolling end hook
        this.onSwipeEnd = () => {};
        // @{param} [onTransform: Function] transfrom state changed hook
        this.onTransform = () => {};
        // @{param} [onRestore: Function] transfrom state change back to initial value hook
        this.onRestore = () => {};
        // @{param} [onSchedule: Function] before transform state FIRST update hook
        this.onSchedule = () => {};

        // effect settings (for momentum-based scrolling animation)
        // @{param} [cubic: {[scroll|boucnde]: number[4]}] anim easing function (cubic-bezier) of scroll/bounce effect, default as below
        this.cubic = {
            scroll: [.33, 1, .66, 1],
            bounce: [.17, 1, .17, 1],
        };
        // @{param} [bouncing: number] scale bouncing animation duration(ms), default as 300ms
        this.bouncing = 3e2;
        // @{param} [bounceRateX: number] drag damping [translate offset / touch offset] when drag(x-axis) out of viewport, default as 0
        this.bounceRateX = 0;
        // @{param} [bounceRateX: number] drag damping [translate offset / touch offset] when drag(y-axis) out of viewport, default as 0
        this.bounceRateY = 0;
        // @{param} [damp: number] momentum-based scrolling option, speed decreasement per frame, default as 2px/frame
        this.damp = 2;
        // @{param} [motionThreshold: number] min speed for genreate momentum-based scrollin effect
        this.motionThreshold = 10;

        // UPDATE OPTIONS to CONFIG
        this.config(options);
    
        // private state

        // @{state} [boundingRect: {[left|right|top|bottom]: number}] dom boundary state
        this.boundingRect = null;
        // @{state} [disableContentTouch: boolean] record state when first touching, confirm whether the existing drag-and-zoom interaction capability of the page needs to be blocked
        this.disableContentTouch = true;
        // @{state} [scaling: boolean] scale process flag
        this.scaling = false;
        // @{state} [pinchStartCenter: number[2]] scale start point position (relative to DOM BOUNDARY)
        this.pinchStartCenter = [];
        // @{state} [pinchStartLen: number] finger distance since scale start
        this.pinchStartLen = 0;
        // @{state} [dragging: boolean] drag process flag
        this.dragging = false;
        // @{state} [dragX: number] current drag point positionX (relative to CLIENT)
        this.dragX = 0;
        // @{state} [dragY: number] current drag point positionY (relative to CLIENT)
        this.dragY = 0;
        // @{state} [dragStartV: number[2]] drag start point position (relative to CLIENT)
        this.dragStartTime = 0;
        this.dragStartV = [0, 0];
        // @{state} [edges: {[left|right|top|bottom]: number}] union set of dom boundary & viewport (outside range)
        this.edges = {}
        // @{state} [timer: TIMEOUT] setTimeout timer for updating dom style
        this.timer = 0;
        // @{state} [animating: boolean] transform process flag
        this.animating = false;
        // @{state} [cancelSwipe: timer] momentum-based scrolling animation timer, for tap-stop effect
        this.cancelSwipe = null;
        // @{state} [isTapStopped: boolean] record whether current transform process ended by tap-stop effect
        this.isTapStopped = false;
    
        // @{state} [interActBound: {[left|right|top|bottom]: number}] interact start boundary
        this.interActBound = null;

        // compute edge with dom boundary and viewport
        this._computeEdge();

        // @{state} [lastTransform: {[translateX|translateY|scale]: number}] last transfrom state record
        this.lastTransform = {};

        // @{state} [animationStyleDom: HTMLElement] <style> dom, used when set [swipeMode] as 'animation'
        this.animationStyleDom = null;
    }

    enable() {
        this.active = true;
        return this;
    }

    disable() {
        this.active = false;
        return this;
    }

    // update config
    config(options = {}) {
        const {
            viewport,
            dom,
            useDomBoundary,
            maxScale,
            minScale,
            fixedX,
            fixedY,
            bounceRateX,
            bounceRateY,
            active,
            preventScroll,
            transform,
            damp,
            dragMode,
            swipeMode,
            cubic,
            transformMode,
            motionThreshold,
            bounce,
            onZoomStart,
            onZoomEnd,
            onDragStart,
            onDragEnd,
            onSwipeEnd,
            onTransform,
            onRestore,
            onSchedule,
        } = options;
        viewport && this.setViewport(viewport);
        dom && this.setDom(dom, useDomBoundary);
        maxScale && this.setMaxScale(maxScale);
        minScale && this.setMinScale(minScale);
        dragMode && this.setDragMode(dragMode);
        swipeMode && this.setSwipeMode(swipeMode);
        transformMode && this.setTransformMode(transformMode);
        cubic && this.setCubic(cubic);

        // support set 0
        (motionThreshold !== void 0) && this.setMotionThreshold(motionThreshold);
        (bounceRateX !== void 0) && this.setBounceRateX(bounceRateX);
        (bounceRateY !== void 0) && this.setBounceRateY(bounceRateY);

        (fixedX !== void 0) && this.setFixedX(fixedX);
        (fixedY !== void 0) && this.setFixedY(fixedY);
        (active !== void 0) && (this.active = Boolean(active));
        (preventScroll !== void 0) && (this.preventScroll = Boolean(preventScroll));

        transform && this.setTransform(transform);
        (damp !== void 0) && this.setDamp(damp);
        (bounce !== void 0) && this.setBounce(bounce);

        // update events
        this.on('transform', onTransform)
            .on('restore', onRestore)
            .on('schedule', onSchedule)
            .on('zoomStart', onZoomStart)
            .on('zoomEnd', onZoomEnd)
            .on('dragStart', onDragStart)
            .on('dragEnd', onDragEnd)
            .on('swipeEnd', onSwipeEnd);

        return this;
    }

    // update translate dom
    setDom(dom, useDomBoundary = true) {
        if (dom) {
            this.useDomBoundary = useDomBoundary;
            if (this.dom !== dom) {
                this.removeDom();
                this.dom = dom;
                dom.addEventListener('touchstart', this.touchStart);
                dom.addEventListener('touchmove', this.touchMove);
                dom.addEventListener('touchend', this.touchEnd);
                dom.addEventListener('touchcancel', this.touchEnd);
                dom.style.willChange = 'transform';
                dom.style.transition = '';
                dom.style.transform = '';
                dom.style.webkitTransform = '';
                dom.style.transformOrigin = '';
                dom.style.webkitTransformOrigin = '';
                this.transform = {};
                this.lastTransform = {};
                if (useDomBoundary) {
                    _raf(() => {
                        if (!this.boundingRect) {
                            // re-getBoundary if no boundingRect set
                            this.setBoundary(dom.getBoundingClientRect());
                        }
                    });
                }
            }
        }
        return this;
    }

    // manually update boundary
    setBoundary(bounding, transformed = false) {
        const { left, right, top, bottom } = !transformed ? bounding : this._getRawBounding(bounding);
        this.boundingRect = {
            ...(this.boundingRect || this.viewport),
            left,
            right,
            top,
            bottom,
        };
        this._computeEdge();
        return this;
    }

    removeDom() {
        if (this.dom) {
            this.dom.removeEventListener('touchstart', this.touchStart);
            this.dom.removeEventListener('touchmove', this.touchMove);
            this.dom.removeEventListener('touchend', this.touchEnd);
            this.dom.removeEventListener('touchcancel', this.touchEnd);
        }
        return this;
    }

    setMaxScale(maxScale) {
        if (!isNaN(maxScale)) {
            this.maxScale = Math.max(Number(maxScale), 1);
        }
        return this;
    }

    setMinScale(minScale) {
        if (!isNaN(minScale)) {
            this.minScale = Math.min(Number(minScale), 1);
        }
        return this;
    }

    setMotionThreshold(motionThreshold) {
        if (!isNaN(motionThreshold)) {
            this.motionThreshold = motionThreshold;
        }
        return this;
    }

    setCubic(cubic = {}) {
        for(const k in cubic) {
            if ((cubic[k] instanceof Array) && cubic[k].length === 4) {
                this.cubic[k] = cubic[k].map(k => isNaN(Number(k)) ? Number(k) : 0);
            }
        }
        return this;
    }

    setDragMode(mode) {
        this.dragMode = mode;
    }

    setSwipeMode(mode) {
        this.swipeMode = mode;
    }

    setTransformMode(mode) {
        this.transformMode = mode;
    }

    setBounceRateX(bounceRateX) {
        if (!isNaN(bounceRateX)) {
            this.bounceRateX = Math.min(Number(bounceRateX), 1);
        }
        return this;
    }

    setBounceRateY(bounceRateY) {
        if (!isNaN(bounceRateY)) {
            this.bounceRateY = Math.min(Number(bounceRateY), 1);
        }
        return this;
    }

    setViewport(viewport = {}) {
        let changed = false;
        ['left', 'right', 'top', 'bottom'].forEach(k => {
            const val = Number(viewport[k]);
            if(!isNaN(val)) {
                this.viewport[k] = val;
                changed = true;
            }
        });
        changed && this._computeEdge();
        return this;
    }

    setFixedX(fixedX) {
        this.fixedX = !!fixedX;
        if (fixedX) {
            const { transformOrigin } = this.transform;
            if (transformOrigin) {
                const { left, right } = this.boundingRect || this.viewport;
                transformOrigin[0] = (right - left) / 2;
            }
            this.setTransform({
                translateX: 0,
            }, {
                merge: true,
            });
        }
        return this;
    }

    setFixedY(fixedY) {
        this.fixedY = !!fixedY;
        if (fixedY) {
            const { transformOrigin } = this.transform;
            if (transformOrigin) {
                const { top, bottom } = this.boundingRect || this.viewport;
                transformOrigin[1] = (bottom - top) / 2;
            }
            this.setTransform({
                translateY: 0,
            }, {
                merge: true,
            });
        }
        return this;
    }

    setBounce = bounce => {
        !isNaN(bounce) && (this.bouncing = Number(bounce));
    }

    setDamp = (damp = 0) => {
        !isNaN(damp) && (this.damp = Number(damp));
    }

    // update transform state, trigger onTransform hook if options.slient as true
    setTransform = (transform = {}, options = {}) => {
        if (this.fixedX && transform.translateX) {
            delete transform.translateX;
        }
        if (this.fixedY && transform.translateY) {
            delete transform.translateY;
        }
        if (!options.merge) {
            this.transform = {
                ...transform,
            };
        } else {
            ['translateX', 'translateY', 'scale'].forEach(k => {
                (transform[k] !== void 0) && (this.transform[k] = parseFloat(transform[k]));
            });
            const { transformOrigin } = transform;
            if ((transformOrigin instanceof Array) && (transformOrigin.length === 2)) {
                this.transform.transformOrigin = transformOrigin.map(k => parseFloat(k));
            }
        }
        if (!options.silent) {
            this.update();
        }
        return this;
    }

    // update event hooks
    on = (event, f) => {
        if (f && (typeof f === 'function')) {
            const evt = `on${event[0].toUpperCase()}${event.slice(1)}`;
            if (this[evt]) {
                if (evt === 'onTransform') {
                    this[evt] = () => f({
                        // transform state
                        ...this.transform,
                    }, {
                        // effect end
                        complete: !this.busy(),
                        // transform state changed
                        dirty: this.dirty(),
                    });
                } else {
                    this[evt] = f;
                }
            } else {
                console.warn('[Transform]Unsupport event:', event); // eslint-disable-line
            }
        }
        return this;
    }

    // restore transform state, keep translate state only if [dragMode] as 'always'
    restore = silent => {
        if (!silent) {
            const { transform } = this;
            _raf(() => {
                this.onRestore(transform);
            });
        }
        if (this.dragMode === DRAG_MODE.ALWAYS) {
            this.zoomTo(1, { fitEdge: true });
        } else {
            this.setTransform({}, {
                merge: false,
                silent,
            });
        }
    }

    // obtain transform state
    getTransform = type => {
        switch (type) {
        case('css'):
            return this.toCSS();
        case('style'):
            return this.toStyle();
        default: 
            return {
                ...this.transform,
            };
        }
        
    }

    // check if transformed
    dirty = () => {
        const { translateX = 0, translateY = 0, scale = 1 } = this.transform;
        return (translateX !== 0) || (translateY !== 0) || (scale !== 1);
    }

    // check if transforming
    busy = () => {
        return (!this.disableContentTouch) || this.cancelSwipe || this.animating;
    }

    // check if transform ended by tap-stop
    isTapStop =  () => {
        return this.isTapStopped;
    }

    // update transform state to dom style
    apply = () => {
        if (this.dom) {
            const css = this.toCSS();
            this.dom.style.transform = css.transform || '';
            this.dom.style.webkitTransform = css.transform || '';
            this.dom.style.transformOrigin = css.transformOrigin || 'center center';
            this.dom.style.webkitTransformOrigin = css.transformOrigin || 'center center';
        }
        this.onTransform();
        this.timer = 0;
    }

    // private function, trigger onTransform
    update = () => {
        _caf(this.timer);
        this.timer = _raf(this.apply);
        this.lastTransform = { ...this.transform };
    }

    // revert to last transfrom state
    cancel = () => {
        _caf(this.timer);
        this.transform = { ...this.lastTransform };
    }

    // distance to top edge
    toTop = () => {
        const { scale = 1 } = this.transform;
        const [, remainY] = this._remainToEdge(1, 1);
        return Math.round(Math.abs(remainY / scale));
    }

    // distance to bottom edge
    toBottom = () => {
        const { scale = 1 } = this.transform;
        const [, remainY] = this._remainToEdge(1, -1);
        return Math.round(Math.abs(remainY / scale));
    }

    // distance to left edge
    toLeft = () => {
        const { scale = 1 } = this.transform;
        const [remainX, ] = this._remainToEdge(1, 1);
        return Math.round(Math.abs(remainX / scale));
    }

    // distance to right edge
    toRight = () => {
        const { scale = 1 } = this.transform;
        const [remainX, ] = this._remainToEdge(-1, 1);
        return Math.round(Math.abs(remainX / scale));
    }

    // get position relative to dom boundary
    getOriginXY = touchAxis => {
        const [clientX, clientY] = touchAxis;
        const { left, top } = this._getTransformedBounding();
        const { scale = 1 } = this.transform;
        // update translate offset when boundary changed by scale
        return [
            (clientX - left) / scale,
            (clientY - top) / scale,
        ];
    }
    
    // update zoom center point (relative to client -> relative to dom boundary)
    setScreenCenter = (clientX, clientY, forceUpdate) => {
        const [originX, originY] = this.getOriginXY([clientX, clientY]);
        return this.setCenter(originX, originY, forceUpdate);
    }

    // update transform-origin & translate offset, keep dom position
    setCenter = (x, y, forceUpdate) => {
        const { transform, fixedX, fixedY, boundingRect, viewport } = this;
        const { translateX = 0, translateY = 0, scale = 1 } = transform;
        let { transformOrigin } = transform;
        const { top, bottom, left, right } = boundingRect || viewport;
        if (!transformOrigin) {
            // lazy initial transform center
            transformOrigin = [
                (right - left) / 2,
                (bottom - top) / 2,
            ];
        }
        // Immediately change the center point and do translation compensation when zooming
        if (!fixedX) {
            // The translate value is not updated when the x,y axis is fixed
            const disX = (x - transformOrigin[0]);
            x = transformOrigin[0] + disX;
            transform.translateX = translateX + disX * (scale - 1) / scale;
            transformOrigin[0] = x;
        }
        if (!fixedY) {
            const disY = (y - transformOrigin[1]);
            y = transformOrigin[1] + disY; 
            transform.translateY = translateY + disY * (scale - 1) / scale;
            transformOrigin[1] = y;
        }
        transform.transformOrigin = transformOrigin;
        forceUpdate && this.update();
    }

    zoomToScreenCenter = (rate, center, options = {}) => {
        const [x, y] = center;
        this.setScreenCenter(x, y, true);
        // Update after two frame, but why?
        _raf(() => _raf(() => {
            this.zoomTo(rate, {
                fitEdge: true,
                ...options,
            });
        }));
    }

    zoomToCenter = (rate, center, options = {}) => {
        const [x, y] = center;
        this.setCenter(x, y, true);
        // Update after two frame, but why?
        _raf(() => _raf(() => {
            this.zoomTo(rate, {
                fitEdge: true,
                ...options,
            });
        }));
    }

    // Zoom to target value (absolute)
    zoomTo = (rate, options = {}) => {
        const {
            transition = 'all',
            easingFunc = 'ease-out',
            duration = 0,
            silent = true,
            fitEdge = false,
            callback,
        } = options;
        const { maxScale = 1, minScale = 1, transform } = this;
        const { scale = 1, translateX = 0, translateY = 0 } = transform;
        const newScale = Math.max(Math.min(rate, maxScale), minScale);
        const r = newScale / scale;
        this.transform.scale = newScale;
        // Translation compensation
        this.transform.translateX = translateX / r;
        this.transform.translateY = translateY / r;
        fitEdge && this.fit(false);
        if (this.dom && duration) {
            this.dom.style.transition = `${transition} ${duration}ms ${easingFunc}`;
            this.animating = true;
            setTimeout(() => {
                this.dom.style.transition = '';
                this.animating = false;
                !silent && this.onZoomEnd(null, newScale);
                (typeof callback === 'function') && callback(newScale);
            }, duration);
        } else {
            (typeof callback === 'function') && callback(newScale);
        }
        this.update();
    }

    // Zoom to target value (relative to current)
    zoom = (rate = 1, options = {}) => {
        const { scale = 1 } = this.transform;
        this.zoomTo(scale * rate, options);
    }

    // Drag the specified distance (relative to the current state), useBounce means allow to go beyond the boundary and enable the rebound effect, ignoreEdge means force drag the specified distance, ignoring the boundary
    drag = (disX, disY, useBounce, ignoreEdgeX, ignoreEdgeY) => {
        const { transform, interActBound, fixedX, fixedY, bounceRateX, bounceRateY } = this;
        const { translateX = 0, translateY = 0, scale = 1 } = transform;
        // Shield dragging when fixing x, y axis
        fixedX && (disX = 0);
        fixedY && (disY = 0);
        // First, determine whether the boundary is touched, obtain the distance from the page boundary to the content boundary, and use the interaction time boundary as the boundary when there is interaction.
        const [edgeX, edgeY] = this._remainToEdge(disX, disY, interActBound);
        // Formula explanation:
        // disX > 0, it means swipe right, if the left border exceeds the page range, then edgeX is a negative value, after swiping the disX distance, the distance from the page border is edgeX + disX, if the value is positive, it means that the swipe After moving, the left border will enter the page, that is, the border will be reached
        // disX < 0, means swip lefte, if the right border exceeds the page range, then edgeX is a positive value, after swiping the disX distance, the distance from the page border is edgeX + disX, if the value is negative, it means the swipe After moving, the right border will enter the page, that is, the border will be reached
        const overEdgeX = (edgeX + disX) * disX > 0;
        const overEdgeY = (edgeY + disY) * disY > 0;
        let offsetX = 0;
        let offsetY = 0;
        const slideX = Math.abs(disX) > Math.abs(disY);
        const toEdge = (slideX && overEdgeX) || (!slideX && overEdgeY);
        if (disX) {
            if (ignoreEdgeX) {
                offsetX = disX;
            } else {
                offsetX = this._getDragV(disX, edgeX, overEdgeX, useBounce ? bounceRateX : 0);
            }
            this.transform.translateX = (translateX + offsetX / scale);
        }
        if (disY) {
            // same to disY
            if (ignoreEdgeY) {
                offsetY = disY;
            } else {
                offsetY = this._getDragV(disY, edgeY, overEdgeY, useBounce ? bounceRateY : 0);
            }
            this.transform.translateY = (translateY + offsetY / scale);
        }
        const remain = [!fixedX ? -edgeX : 0, !fixedY ? -edgeY : 0];
        this.update();

        if (this.interActBound) {
            const { left, right, top, bottom } = interActBound;
            // Update bounding if necessary
            this.interActBound = {
                left: left + offsetX,
                right: right + offsetX,
                top: top + offsetY,
                bottom: bottom + offsetY,
            };
        }
        return {
            // Whether moved to the border
            toEdge,
            // The draggable distance from the boundary when dragging
            remain,
        };
    }

    // Determine whether the current transform state exceeds the boundary, and compensate if it exceeds
    fit = (useBounce = true, ignoreX, ignoreY) => {
        // Use a displacement minimum to determine whether there is out of bounds
        let changed = false;
        const { translateX = 0, translateY = 0, scale = 1 } = this.transform;
        const { outX, outY, outLeft, outRight, outTop, outBottom } = this._outOfEdge();
        if (!ignoreX && outX) {
            outRight && (this.transform.translateX = translateX + outRight / scale);
            outLeft && (this.transform.translateX = translateX + outLeft / scale);
            changed = true;
        }
        if (!ignoreY && outY) {
            outBottom && (this.transform.translateY = translateY + outBottom / scale);
            outTop && (this.transform.translateY = translateY + outTop / scale);
            changed = true;
        }
        changed && useBounce && this.bounce();
        this.update();
        return changed;
    }

    fitX = (useBounce = true) => {
        return this.fit(useBounce, false, true);
    }

    fitY = (useBounce = true) => {
        return this.fit(useBounce, true, false);
    }

    // momentum-based scrolling
    swipe = v => {
        const { damp } = this;
        if (damp) {
            // Each frame is 17ms, and the corresponding value of the current sliding speed in one frame is estimated
            const l = getDistance(v);
            if (isNaN(l)) {
                return;
            }
            if (this.cancelSwipe) {
                this.cancelSwipe();
            }
            let timer = 0;
            // Calculate how many frames to split this velocity value for decrement
            let steps = Math.ceil(l / this.damp);
            const { translateX = 0, translateY = 0, scale = 1 } = this.transform;
            const [scrollCubic, bounceCubic] = [
                [...this.cubic.scroll],
                [...this.cubic.bounce],
            ]
            if (this.dom) {
                let swipeSpan = 50 * FRAME_SPAN;
                let cubicBezier = [null, scrollCubic];
                let timeout = 0;
                let bounceXTimer = 0;
                let bounceYTimer = 0;
                // Get the original transform state
                const baseFrame = [[0, [
                    translateX * scale,
                    translateY * scale,
                ]]];
                const finishSwipe = () => {
                    timeout = 0;
                    this.cancelSwipe();
                }
                // Momentum limit cannot exceed screenWH
                const [ swipeX, swipeY ] = [v[0] * steps / 2, v[1] * steps / 2];
                const { bounceRateX, bounceRateY } = this;
                // Boundary overflow before recording momentum
                const { outX, outY } = this._outOfEdge();
                const { remain } = this.drag(swipeX, swipeY, false, bounceRateX, bounceRateY);
                // Boundary overflow after recording momentum
                const { outX: overEdgeX, outY: overEdgeY } = this._outOfEdge();
                if (overEdgeX || overEdgeY) {
                    cubicBezier[1] = bounceCubic;
                }
                // The maximum value of the rebound overflow, the default is 1/3 of the screen width and height
                const [bounceMaxX, bounceMaxY] = [window.innerWidth * DRAG_SWIPE_BOUNCE_MAX_DIS, window.innerHeight * DRAG_SWIPE_BOUNCE_MAX_DIS];
                if (this.swipeMode === SWIPE_MODE.ANIM) {
                    this.cancel();
                    const yFrame = this._setSwipeBounceByAnimation(swipeY, remain[1], overEdgeY, outY, bounceRateY, swipeSpan, cubicBezier[1], bounceMaxY);
                    const xFrame = this._setSwipeBounceByAnimation(swipeX, remain[0], overEdgeX, outX, bounceRateX, swipeSpan, cubicBezier[1], bounceMaxX);
                    const bouncedX = xFrame.length > 1;
                    const bouncedY = yFrame.length > 1;
                    [xFrame, yFrame].forEach((frame, idx) => frame.forEach(keyFrame => {
                        // Compensate for base offset
                        keyFrame[1] += baseFrame[0][1][idx];
                        for(let i = 0; i < baseFrame.length; i += 1) {
                            if (keyFrame[0] === baseFrame[i][0]) {
                                baseFrame[i][1][idx] = keyFrame[1];
                                return;
                            } else if (keyFrame[0] < baseFrame[i][0]) {
                                const pos = [null, null];
                                pos[idx] = keyFrame[1];
                                baseFrame.splice(i, 0, [keyFrame[0], pos]);
                                return;
                            }
                        }
                        const pos = [null, null];
                        pos[idx] = keyFrame[1];
                        baseFrame.push([keyFrame[0], pos]);
                    }));
                    const duration = baseFrame[baseFrame.length - 1][0];
                    const pointCache = {};
                    baseFrame.forEach((frame, i) => {
                        const [t, pos] = frame;
                        pos.map((p, idx) => {
                            if (p === null) {
                                const lastP = baseFrame[i - 1][1][idx];
                                const lastT = baseFrame[i - 1][0];
                                let nextP = lastP;
                                let nextT = lastT;
                                for(let j = i + 1; j < baseFrame.length; j += 1) {
                                    if (baseFrame[j][1][idx] !== null) {
                                        nextP = baseFrame[j][1][idx];
                                        nextT = baseFrame[j][0];
                                        break;
                                    }
                                }
                                if (lastT !== nextT) {
                                    const y = [];
                                    [lastT, t, nextT].forEach((_t, j) => {
                                        if (pointCache[_t]) {
                                            y[j] = pointCache[_t];
                                        } else {
                                            y[j] = getCubicBezierPoint(cubicBezier[1], _t / duration, 'x')[1];
                                        }
                                    });
                                    frame[1][idx] = lastP + (nextP - lastP) * (y[1] - y[0]) / (y[2] - y[0]);
                                } else {
                                    frame[1][idx] = lastP;
                                }
                            }
                        });
                    });
                    baseFrame.forEach(frame => {
                        frame[1] = `transform: ${this.toCSS({
                            translateX: frame[1][0] / scale,
                            translateY: frame[1][1] / scale,
                            scale,
                        }).transform}`;
                    });
                    this._appendAnimation(baseFrame, `cubic-bezier(${cubicBezier[1].join(',')}`, duration);
                    timeout = setTimeout(finishSwipe, duration + FRAME_SPAN);
                    this.cancelSwipe = () => {
                        this._stopAnimation();
                        this._syncDom();
                        this.dom.style.animation = '';
                        if (timeout) {
                            clearTimeout(timeout);
                            (bouncedX || bouncedY) && this.fit(false);
                        }
                        this.cancelSwipe = null;
                        this.onSwipeEnd(this.transform);
                    };
                } else {
                    // tap-stop by css
                    this.dom.style.transition = `transform ${swipeSpan}ms cubic-bezier(${cubicBezier[1].join(',')})`;
                    timer = _raf(() => {
                        timeout = setTimeout(finishSwipe, swipeSpan);
                        const syncContext = f => {
                            const resp = f(swipeSpan, cubicBezier) || {};
                            // variable reflection
                            swipeSpan = resp.swipeSpan || swipeSpan;
                            cubicBezier = resp.cubicBezier || cubicBezier;
                            // side effect
                            clearTimeout(timeout);
                            timeout = setTimeout(finishSwipe, swipeSpan);
                        }
                        if (overEdgeX) {
                            if (outX && (swipeX * remain[0] > 0)) {
                                // The starting point overflows / the ending point overflows / the sliding direction and the rebound direction are in the same direction / the momentum is too small ====> rebound directly
                                this.fitX(false);
                            } else {
                                cubicBezier[1] = [...bounceCubic];
                                // The starting point does not overflow / the ending point overflows =====> processed according to the rebound
                                bounceXTimer = this._setSwipeBounce(swipeX, remain[0], bounceRateX, syncContext, 'x', bounceMaxX);
                            }
                        }
                        // same to Y-axis
                        if (overEdgeY) {
                            if (outY && (swipeY * remain[1] > 0)) {
                                this.fitY(false);
                            } else {
                                cubicBezier[1] = [...bounceCubic];
                                bounceYTimer = this._setSwipeBounce(swipeY, remain[1], bounceRateY, syncContext, 'y', bounceMaxY);
                            }
                        }
                    });
                    this.cancelSwipe = () => {
                        timer && _caf(timer);
                        if (timeout) {
                            bounceXTimer && clearTimeout(bounceXTimer);
                            bounceYTimer && clearTimeout(bounceYTimer);
                            clearTimeout(timeout);
                            this._syncDom();
                            (bounceXTimer || bounceYTimer) && this.fit(false);
                        }
                        this.dom.style.transition = '';
                        this.cancelSwipe = null;
                        this.onSwipeEnd(this.transform);
                    }
                }
            } else {
                const dx = v[0] / steps;
                const dy = v[1] / steps;
                const animate = () => {
                    const [disX, disY] = [(steps - 0.5) * dx, (steps - 0.5) * dy];
                    // Execute drag operation
                    this.drag(disX, disY);
                    // Schedule animation for next frame 
                    steps -= 1;
                    if (steps > 0) {
                        timer = _raf(animate);
                        this.cancelSwipe = () => {
                            // tap-stop by js
                            timer && _caf(timer);
                            this.cancelSwipe = null;
                            this.onSwipeEnd(this.transform);
                        }
                    } else {
                        timer = 0;
                        this.cancelSwipe();
                    }
                }
                timer = _raf(animate);
            }
        }
    }

    // Temporarily add a rebound animation
    bounce = () => {
        const { bouncing } = this;
        if (bouncing && this.dom) {
            this.dom.style.transition = `all ${bouncing}ms cubic-bezier(.14, 1, .34, 1)`;
            this.animating = true;
            setTimeout(() => {
                this.animating = false;
                this.dom.style.transition = '';
            }, bouncing);
        }
    }

    touchStart = e => {
        // Reset busy flag
        this.disableContentTouch = true;
        // In non-transition state, zooming is enabled only when zooming to a larger multiple is allowed
        if (this.active && !this.animating) {
            // Reset scale/drag flag
            this.scaling = false;
            this.dragging = false;

            if (this.cancelSwipe) {
                // Put it on the outermost side to ensure that you can click and stop when multiple fingers are triggered at the same time
                this.cancelSwipe();
                this.isTapStopped = true;
            } else if (!this.dirty()) {
                // Update bounds before getting transform center
                if (this.useDomBoundary) {
                    this.setBoundary(this.dom.getBoundingClientRect());
                }
                this.onSchedule();
            }
            if (e.touches.length > 1) {
                const { scale = 1 } = this.transform;
                // Enable flag bit, indicating entering gesture event flow
                this.disableContentTouch = false;
                // Calculate the center of the two fingers and confirm the new transformation center point
                const [x, y] = this.getOriginXY([
                    (e.touches[1].clientX + e.touches[0].clientX) / 2,
                    (e.touches[1].clientY + e.touches[0].clientY) / 2,
                ]);
                this.pinchStartCenter = [x, y];
                this.setCenter(x, y);

                // Calculate the distance between two fingers as a scale base
                this.pinchStartLen = getDistance([
                    e.touches[1].clientX - e.touches[0].clientX,
                    e.touches[1].clientY - e.touches[0].clientY,
                ]);
                // Enable zoom flag
                this.scaling = true;
                this.onZoomStart(e, scale, this.pinchStartCenter);
            } else if (this.dragMode === DRAG_MODE.ALWAYS || (this.dragMode === DRAG_MODE.HYBRID && this.dirty())) {
                // Enable flag bit, indicating entering gesture event flow
                this.disableContentTouch = false;
                this.dragStartTime = + new Date();
                this.lastDragStartTime = 0;
                const [x, y] = [
                    e.touches && e.touches[0] ? e.touches[0].clientX : 0,
                    e.touches && e.touches[0] ? e.touches[0].clientY : 0,
                ];
                this.dragStartV = [x, y];
                this.lastDragStartV = [];
                // The current div has been zoomed or moved, record the drag start point
                this.dragX = x;
                this.dragY = y;
            }
        }
    }

    touchMove = e => {
        if (!this.disableContentTouch) {
            const { changedTouches = [] } = e;
            if (this.scaling) {
                // Block drag logic since zoom process triggered
                if (e.touches.length > 1) {
                    // Get the current two-finger distance, compare it with the initial distance, and get the magnification ratio
                    const pinchLen = getDistance([
                        e.touches[1].clientX - e.touches[0].clientX,
                        e.touches[1].clientY - e.touches[0].clientY,
                    ]);
                    this.zoom(pinchLen / this.pinchStartLen);
                    this.pinchStartLen = pinchLen;
                }
            } else {
                const touchMoveX = changedTouches[0] ? changedTouches[0].clientX : 0;
                const touchMoveY = changedTouches[0] ? changedTouches[0].clientY : 0;
                const disX = touchMoveX - this.dragX;
                const disY = touchMoveY - this.dragY;
                // The first drag doesn't trigger inertial rebound
                const { toEdge } = this.drag(disX, disY, this.dragging);
                this.dragX = touchMoveX;
                this.dragY = touchMoveY;
                const dragStartTime = (+ new Date());
                if (dragStartTime > this.dragStartTime + DRAG_SWIPE_TIMEOUT) {
                    this.lastDragStartV = this.dragStartV;
                    this.lastDragStartTime = this.dragStartTime;
                    this.dragStartTime = dragStartTime;
                    this.dragStartV = [touchMoveX, touchMoveY];
                }
                if (!this.dragging) {
                    // Active drag flag after first drag
                    this.dragging = true;
                    if (toEdge) {
                        this.disableContentTouch = true;
                    } else {
                        this.onDragStart(e);
                        this.interActBound = this._getTransformedBounding(true);
                    }
                }
            }
            this.preventScroll && e.preventDefault();
        }
    }

    touchEnd = e => {
        if (!this.disableContentTouch) {
            if (e.touches.length === 0) {
                const { scale = 1 } = this.transform;
                if (this.scaling) {
                    this.onZoomEnd(e, scale, this.pinchStartCenter);
                    if (scale < 1) {
                        // The zoom ratio is less than 1 and directly restores to no transform
                        this.restore();
                    } else {
                        // Fit to the edge
                        this.fit();
                    }
                } else if (this.dragging) {
                    // If it is dragged outside the boundary, rebound directly, otherwise enter the momentum scrolling decision logic
                    let dragCostTime = (+ new Date()) - this.dragStartTime;
                    let dragStartV = this.dragStartV;
                    // The measurement is inaccurate when only 1-2 frames, take the last recorded position
                    if (dragCostTime < 50 && this.lastDragStartTime) {
                        dragCostTime = (+ new Date()) - this.lastDragStartTime;
                        dragStartV = this.lastDragStartV;
                    }
                    const dragEndV = [
                        e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0,
                        e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0,
                    ];
                    const swipeV = [
                        FRAME_SPAN * (dragEndV[0] - dragStartV[0]) / dragCostTime,
                        FRAME_SPAN * (dragEndV[1] - dragStartV[1]) / dragCostTime,
                    ];
                    this.onDragEnd(e);
                    
                    // Inertial swipe is enabled only for the operation process within 300ms
                    if (getDistance(swipeV) > this.motionThreshold) {
                        this.swipe(swipeV);
                    } else {
                        // Trigger a transform event to ensure that the last transform of the drag can be captured
                        this.fit();
                    }
                }
                // Release the gesture flag in the next frame to avoid triggering the upper touchEnd
                _raf(() => {
                    this.disableContentTouch = true;
                    this.pinchStartLen = 0;
                    this.interActBound = null;
                    this.isTapStopped = false;
                });
            }
        }
    }

    // Convert the current transform state to a string
    toStyle() {
        const { transform, transformOrigin } = this.toCSS();
        let styleStr = '';
        transform && (styleStr += `transform: ${transform}`);
        transformOrigin && (styleStr += `transform-origin: ${transformOrigin}`);
        return styleStr;
    }

    // Convert the current transform state to formatted object
    toCSS(t) {
        let transform = '';
        let transformOrigin = 'center';
        if (t || this.dirty()) {
            const trans = t || this.transform;
            if (this.transformMode === TRANSFORM_MODE.TRANS_FIRST) {
                const { scale = 1 } = this.transform;
                ['translateX', 'translateY'].forEach(key => {
                    (trans[key] !== void 0) && (transform += `${key}(${trans[key] * scale}px)`);
                });
                transform += `scale(${scale})`;
            } else if (this.transformMode === TRANSFORM_MODE.SCALE_FIRST) {
                ['scale', 'translateX', 'translateY'].forEach((key, isTranslate) => {
                    const unit = isTranslate ? 'px' : '';
                    (trans[key] !== void 0) && (transform += `${key}(${trans[key]}${unit})`);
                });
            } else {
                const { scale = 1, translateX = 0, translateY = 0 } = trans;
                transform = `matrix(${scale}, 0, 0, ${scale}, ${translateX * scale}, ${translateY * scale})`;
            }
        }
        if (this.transform.transformOrigin) {
            transformOrigin = this.transform.transformOrigin.map(i => `${Math.round(i)}px`).join(' ');
        }
        return {
            transform,
            transformOrigin,
        };
    }

    _outOfEdge = () => {
        const { left, right, top, bottom } = this._getTransformedBounding();
        const { edges } = this;
        const toLeft = edges.left - left;
        const toRight = edges.right - right;
        const toTop = edges.top - top;
        const toBottom = edges.bottom - bottom;
        const outLeft = toLeft < 0 ? toLeft : 0;
        const outRight = toRight > 0 ? toRight : 0;
        const outTop = toTop < 0 ? toTop : 0;
        const outBottom = toBottom > 0 ? toBottom : 0;
        return {
            outX: !!(outLeft || outRight),
            outY: !!(outTop || outBottom),
            outLeft,
            outRight,
            outTop,
            outBottom,
        };
    }

    // Calculate the difference between the current transformed boundary and the page boundary, so as to determine whether the user will drag to the boundary this time
    _remainToEdge = (disX, disY, boundingRect) => {
        const remain = [0, 0];
        const { edges } = this;
        const { left, right, top, bottom } = boundingRect || this._getTransformedBounding(); 
        // Forward horizontal swipe, the checkpoint is on the left border, reverse horizontal swipe, the checkpoint is on the right border
        const srcEdgeX = disX > 0 ? edges.left : edges.right;
        const srcEdgeY = disY > 0 ? edges.top : edges.bottom;
        // When computing the edge
        const edgeX = disX > 0 ? left : right;
        const edgeY = disY > 0 ? top : bottom;
        remain[0] = edgeX - srcEdgeX;
        remain[1] = edgeY - srcEdgeY;
        return remain;
    }

    // Get the edge according to the set bounding
    _computeEdge = () => {
        const { left: l, right: r, top: t, bottom: b } = this.viewport; 
        if (this.boundingRect) {
            const { left, right, top, bottom } = this.boundingRect;
            this.edges = {
                left: Math.max(left, l),
                top: Math.max(top, t),
                right: Math.min(right, r),
                bottom: Math.min(bottom, b),
            };
        } else {
            // Edge is equivalent to window if dom is not specified
            this.edges = {
                ...this.viewport,
            };
        }
    }

    // Get the transformed bounds
    _getTransformedBounding() {
        const { boundingRect, viewport, transform } = this;
        const { left, top, right, bottom } = boundingRect || viewport;
        const {
            scale = 1,
            transformOrigin = [
                (right - left) / 2, 
                (bottom - top) / 2,
            ],
            translateX = 0,
            translateY = 0,
        } = transform;
        const [x, y] = transformOrigin;
        const offsetX = (translateX - x) * scale + x;
        const offsetY = (translateY - y) * scale + y;
        return {
            left: left + offsetX,
            right: left + offsetX + (right - left) * scale,
            top: top + offsetY,
            bottom: top + offsetY + (bottom - top) * scale,
        };
    }

    // Get the pre-transform boundary
    _getRawBounding(boundingRect) {
        const { transform } = this;
        const { left, top, right, bottom } = boundingRect;
        const {
            scale = 1,
            transformOrigin = [
                (right - left) / 2,
                (bottom - top) / 2,
            ],
            translateX = 0,
            translateY = 0,
        } = transform;
        const [x, y] = transformOrigin;
        const offsetX = (translateX - x) * scale + x;
        const offsetY = (translateY - y) * scale + y;
        return {
            left: left - offsetX,
            right: left - offsetX + (right - left) / scale,
            top: top - offsetY,
            bottom: top - offsetY + (bottom - top) / scale,
        };
    }

    // Get the drag amount, the incoming value is the drag amount, the boundary value, and the drag damping coefficient in the rebound area
    // Return the calculated displacement value and the amount of rebound in it
    _getDragV(dis, edge, overEdge, bounceRate) {
        let bounce = 0;
        let offset = 0;
        if (overEdge) {
            if (bounceRate) {
                const bounceEdge = edge * dis > 0;
                // 有回弹余量的情况下添加回弹余量，将要溢出时取值为（距离-边界距离）* 回弹系数，溢出后取值为 （距离 * 回弹系数 - 边界距离）
                bounce = bounceEdge ? dis * bounceRate : (edge + dis) * bounceRate;
                offset = bounceEdge ? bounce : -edge + bounce;
            } else {
                // 有一侧交互即将穿过边界，则拖拽至边界
                offset = -edge;
            }
        } else {
            offset = dis;
        }
        return offset;
    }


    // swipe: swipe distance
    // remain: the distance from the boundary before sliding
    // over: Whether to exceed the boundary after sliding
    // out: Whether the boundary is exceeded before sliding
    // bounceRate: rebound momentum
    // duration: sliding duration
    _setSwipeBounceByAnimation(swipe, remain, over, out, bounceRate, duration, cubicBezier, max = Infinity) {
        const frames = [];
        const outSwipe = swipe * remain < 0;
        if (over) {
            if (out && !outSwipe) {
                // The momentum direction is in the same direction and less than the boundary margin, rebound directly
                frames.push([duration, remain]);
            } else {
                // Actual rebound distance: the original sliding distance * damping in the opposite direction to the boundary, and the overflow boundary distance * damping in the same direction as the boundary
                let bounceActDis = (outSwipe ? swipe * bounceRate : (swipe - remain) * bounceRate) / 2;
                // cannot exceed the limit
                if (Math.abs(bounceActDis) > max) {
                    bounceActDis *= Math.abs(max / bounceActDis);
                }
                // The distance traveled on the first rebound:
                // When going in the opposite direction of the boundary: rebound distance
                // When going in the same direction as the boundary: rebound distance + boundary distance
                const firstDis = bounceActDis + (outSwipe ? 0 : remain);
                const totalDis = Math.abs(bounceActDis) * 2 + Math.abs(remain);
                // Rebound time point: the first rebound distance / total sliding distance
                const bounce = Math.abs(firstDis) / totalDis;
                const t = getCubicBezierPoint(cubicBezier, bounce, 'y')[0];
                const delay = Math.floor(duration * t);
                if (t > DRAG_SWIPE_BOUNCE_MIN_RATE) {
                    // Momentum is too small, rebound directly
                    frames.push([duration, remain]);
                } else {
                    frames.push([delay, firstDis]);
                    // Go back to origin when rebounding at 50th frame
                    frames.push([duration, remain]);
                }
            }
        } else {
            // In no bounce scene or centered scene, over must be false, and the minimum value needs to be calculated;
            swipe = Math.min(Math.abs(swipe), Math.abs(remain)) * Math.abs(swipe) / swipe;
            frames.push([duration, swipe]);
        }
        return frames;
    }

    _setSwipeBounce(swipe, remain, bounceRate, syncCb, direction = 'x', max = Infinity) {
        const overEdge = swipe * remain < 0;
        // If the sliding starting point exceeds the boundary, take the bounceRate times the swipe value as the elastic overflow, otherwise take the bounceRate times the difference between the swipe and the boundary remaining value
        let bounceActDis = overEdge ? swipe * bounceRate : (swipe - remain) * bounceRate;
        // Cannot exceed the limit
        if (Math.abs(bounceActDis) > max) {
            bounceActDis *= Math.abs(max / bounceActDis);
        }
        // The calculation method of rebound time ratio is rebound amount / total path amount
        const bounce = (bounceActDis + (overEdge ? 0 : remain)) / swipe;
        let timer = 0;
        syncCb((swipeSpan, cubicBezier) => {
            // Calculate time axis coordinates based on target y value
            const point = getCubicBezierPoint(cubicBezier[1], bounce, 'y');
            const delay = Math.max(Math.floor(point[0] * swipeSpan / FRAME_SPAN), 2) * FRAME_SPAN;
            const nextSpan = swipeSpan - delay;
            timer = setTimeout(() => {
                syncCb((swipeSpan, cubicBezier) => {
                    let t = 1 - nextSpan / swipeSpan;
                    let offsetSpan = 0;
                    const update = () => {
                        if (direction === 'x') {
                            this.fitX(false);
                        } else if (direction === 'y') {
                            this.fitY(false);
                        }
                        if (this.dom) {
                            this.dom.style.transition = `transform ${nextSpan - offsetSpan}ms cubic-bezier(${cubicBezier[1].map(k => k.toFixed(3)).join(',')})`;
                        }
                    }
                    if (t > 0) {
                        cubicBezier = splitCubicBezier(cubicBezier[1], t, 'x');
                        update();
                    } else {
                        t = FRAME_SPAN / swipeSpan;
                        offsetSpan = FRAME_SPAN;
                        cubicBezier = splitCubicBezier(cubicBezier[1], t, 'x');
                        _raf(update);
                    }
                    // Update these two values every time the transition is changed
                    return {
                        cubicBezier,
                        swipeSpan: nextSpan,
                    };
                });
            }, delay);
        });
        return timer;
    }

    _syncDom() {
        // css tap-stop
        if (this.dom) {
            const matrix = window.getComputedStyle(this.dom).getPropertyValue('transform');
            const [,,,scale = 1, translateX = 0, translateY = 0] = matrix.split(')')[0].split(', ').map(k => parseFloat(k));
            this.setTransform({
                scale,
                translateX: Math.round(translateX) / scale,
                translateY: Math.round(translateY) / scale,
            }, {
                merge: true,
            });
        }
    }

    _appendStyle(css) {
        if (!this.animationStyleDom) {
            const head = document.head || document.getElementsByTagName('head')[0];
            const style = document.createElement('style');

            head.appendChild(style);

            style.type = 'text/css';
            this.animationStyleDom = style;
        } else {
            const node = this.animationStyleDom.firstChild;
            node && this.animationStyleDom.removeChild(node);
        }
        if (this.animationStyleDom.styleSheet){
            // This is required for IE8 and below.
            this.animationStyleDom.styleSheet.cssText = css;
        } else {
            this.animationStyleDom.appendChild(document.createTextNode(css));
        }
    }

    _appendAnimation(keyFrames, easingFunc, duration) {
        const hash = parseInt((0.5 + 0.5*Math.random())*1e16).toString(16);
        const key = `__transformable_key_${hash}`;
        const frame = [];
        for(let i = 0; i < keyFrames.length; i += 1) {
            const [current, style] = keyFrames[i];
            const percent = Math.floor(1e2 * (current / duration));
            frame.push(`${percent}% { ${style} }`);
        }
        const styleTxt = `@keyframes ${key} {
            ${frame.join('\n')}
        }`;
        this._appendStyle(styleTxt);
        if (this.dom) {
            _raf(() => {
                this.dom.style.animation = `${key} ${duration}ms ${easingFunc}`;
                this.dom.style.animationFillMode = 'forwards';
            });
        }
    }

    _stopAnimation() {
        if (this.dom) {
            this.dom.style.animationPlayState = 'paused';
        }
    }
}