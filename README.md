#Transformable - Powerful 2D Gesture Anim Solution
## Preview
---
![Effect Preview](https://sf1-cdn-tos.toutiaostatic.com/obj/arco-mobile/_static_/transformable.gif)

## Installation
---

Available as an [npm package](https://www.npmjs.com/package/@arco-design/transformable)

```bash
// with npm
npm install @arco-design/transformable

// with yarn
yarn add @arco-design/transformable
```

## Quick Start
---

```javascript
import TransformAble from '@arco-design/transformable';

function MyComponent() {
    const domRef = useRef(null);
    const controllerRef = useRef(null);
    useEffect(() => {
        controllerRef.current = new TransformAble({
            dom: this.dom,
            onTransform: (state) => {
                const { translateX, translateY, scale, transformOrigin } = state;
                // DO SOMETHING IF NECESSARY
            },
        });
    }, []);
    function resetDom() {
        controllerRef.current.zoomTo(1, {
            fitEdge: true,
        });
    }
    return (
        <div className="transform-container"
            style={{ overflow: 'hidden' }}
        >
            <div
                className="transform-demo-object"
                ref={domRef}
            >
            <Button onClick={resetDom}>reset</Button>
        </div>
    )
}
```

## Options
---
All this options can be dynamic changed by calling `.config()`

|Name|Type|Default|Decription|
|-----|-----|-----------|----------------------|
|active|boolean|true|interactive avaiable status flag|
|maxScale|number|2|max scale limit|
|minScale|number|0.5|min scale limit|
|preventScroll|boolean|true|triggle e.preventDefault since touch, in order to prevent scroll dom behavior|
|dom|HTMLElement|null|transform & interactive target|
|useDomBoundary|boolean|true| decide how to compute target boundary for collision detection (inside edge).<br/> `true`: use `dom.getBoundingClientRect` when dom set;<br/> `false`: manually set by `.setBoundary()`|
|bouncing|number|300|scale bouncing animation duration(ms)|
|damp|number|2|momentum-based scrolling option, speed decreasement per frame, default as 2px/frame|
|bounceRateX|number|0|drag damping [translate offset / touch offset] when drag(x-axis) out of viewport, set (0, 1] value to enable dragging out of edge with damping effect and rebound animation|
|bounceRateX|number|0|drag damping [translate offset / touch offset] when drag(y-axis) out of viewport, same to above|
|motionThreshold|number|10|min speed for genreate momentum-based scrollin effect, default as 10px/frame|
|fixedX|boolean|false|disable x-axis dragging|
|fixedY|boolean|false|disable y-axis dragging|
|dragMode|string|'hybrid'|drag effect mode.<br/> `'always'`: enable dragging without scaling;<br/> `'hybrid'`: enable drag only if scaled;<br/> `'none'`: no dragging|
|swipeMode|string|'animation'|decide how to implement momentum-based scrolling animation.<br/>`'animation'`: insert `<style>` css declaration when animation triggered;<br/> `'transition'`: use transition ease function when animation triggered|
|transformMode|string|'translate-first'|animation effect may be different when dragging & scaling both.<br/>`'translate-first'`: set css property `transform` as `translate()scale()`;<br/>`'scale-first'`:  set `transform` as `scale()translate()`;<br/>`'matrix'`: set `transform` as `matrix()`|
|cubic|object|{<br/>  scroll: [.33, 1, .66, 1],<br/>  bounce: [.17, 1, .17, 1], <br/>}|anim easing function (cubic-bezier) of scroll/bounce effect|
|viewport|object|{<br/> left: 0,<br/> right: screenWidth,<br/> top: 0,<br/> bottom: screenHeight<br/>}|viewport scope for collision detection, the edge is defined as viewport ∩ boundary|
