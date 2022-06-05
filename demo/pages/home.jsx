import * as React from 'react';
import TransformAble from '../../src/index';
import './home.less';

/* global window */
export default class Home extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            viewport: {
                left: 50,
                right: 50,
                top: 50,
                bottom: 50,
            },
            object: {
                left: 100,
                right: 100,
                top: 100,
                bottom: -500,
            },
            transform: '',
        };
        this.transformer = null;
        this.dom = null;
        this.viewDom = null;
        this.rangeDom = null;
        this.bounceDom = null;
        this.swipeTime = 0;
    }

    componentDidMount() {
        this.transformer = new TransformAble({
            bounceRateY: 0.38,
            bounceRateX: 0.33,
            dragMode: 'always',
            transformMode: 'matrix',
            /*
            cubic: {
                scroll: [0.5, 0, 0.5, 0],
                bounce: [0.5, 0, 0.35, 0],
            },*/
            //swipeMode: 'transition',
            /*
            onZoomEnd: () => {
                this.transformer.bounce();
                this.transformer.setFixedX(true);
            },*/
            onTransform: t => {
                Object.keys(t).forEach(k => {
                    const v = t[k];
                    if (typeof v === 'number') {
                        t[k] = v.toFixed(3);
                    } else {
                        t[k] = v.map(val => val.toFixed(3));
                    }
                });
                this.setState({
                    transform: t,
                });
            },
        });
        this.setDom();
    }

    componentDidUpdate() {
        this.setDom();
    }

    setDom() {
        if (this.dom && this.transformer) {
            this.transformer.setDom(this.dom)
                .setViewport(this.viewDom.getBoundingClientRect());
        }
        if (!this.shadowTrans && window.Transformable) {
            this.shadowTrans = new window.Transformable({
                bounceRateY: 0.38,
                bounceRateX: 0.33,
                dragMode: 'always',
            });
        }
        if (this.shadowDom && this.shadowTrans) {
            this.shadowTrans.setDom(this.shadowDom)
                .setViewport(this.viewDom.getBoundingClientRect());
        }
    }

    fit(scale = 1) {
        [this.transformer, this.shadowTrans].forEach(transformer => {
            if(!transformer) {
                return;
            }
            transformer.zoomToScreenCenter(scale, [window.innerWidth / 2, window.innerHeight / 2], {
                duration: 200,
            });
        });
    }

    updateDamp() {
        [this.transformer].forEach(transformer => {
            if(!transformer) {
                return;
            }
            transformer.setDamp(this.rangeDom.value);
        });
    }

    swipe(rate = 1) {
        [this.transformer, this.shadowTrans].forEach(transformer => {
            if(!transformer) {
                return;
            }
            transformer.swipe([window.innerWidth * rate / 17, window.innerHeight * rate / 17]);
        });
    }

    onTouchStart() {
        this.swipeTime = + Date.now();
    }

    onTouchEnd(dir = 1) {
        this.swipe(dir * Math.max((+ Date.now() - this.swipeTime) / 500, 1));
        this.swipeTime = 0;
    }

    updateBounce() {
        const v = this.bounceDom.value;
        [this.transformer].forEach(transformer => {
            if(!transformer) {
                return;
            }
            transformer.setBounceRateX(v).setBounceRateY(v);
        });
    }

    shadowTouchStart(e) {
        if (this.shadowDom && this.shadowTrans) {
            this.shadowTrans.touchStart(e);
        }
    }

    shadowTouchMove(e) {
        if (this.shadowDom && this.shadowTrans) {
            this.shadowTrans.touchMove(e);
        }
    }

    shadowTouchEnd(e) {
        if (this.shadowDom && this.shadowTrans) {
            this.shadowTrans.touchEnd(e);
        }
    }

    render() {
        const {
            viewport,
            object,
            transform,
        } = this.state;
        const { transformOrigin = [0, 0], scale = 1, translateX = 0, translateY = 0 } = transform;
        const originX = Number(transformOrigin[0]);
        const originY = Number(transformOrigin[1]);
        return (
            <div className="transform-demo">
                <div className="transform-demo-container">
                    <div className="transform-demo-tools">
                        <input
                            className="transform-demo-range top"
                            ref={ref => this.rangeDom = ref}
                            type="range"
                            name="bounce"
                            min={1}
                            max={5}
                            defaultValue={2}
                            step={0.01}
                            onChange={() => this.updateDamp()}
                        />
                        <input
                            className="transform-demo-range bottom"
                            ref={ref => this.bounceDom = ref}
                            type="range"
                            name="bounce"
                            min={0}
                            max={0.5}
                            defaultValue={0.33}
                            step={0.01}
                            onChange={() => this.updateBounce()}
                        />
                        <button
                            className="transform-demo-btn top left"
                            onClick={() => this.fit()}
                        >-</button>
                        <button
                            className="transform-demo-btn top right"
                            onClick={() => this.fit(2)}
                        >+</button>
                        <button
                            className="transform-demo-btn bottom left"
                            //onClick={() => this.swipe(-1)}
                            onTouchStart={() => this.onTouchStart()}
                            onTouchEnd={() => this.onTouchEnd(-1)}
                        >↖</button>
                        <button
                            className="transform-demo-btn bottom right"
                            //onClick={() => this.swipe()}
                            onTouchStart={() => this.onTouchStart()}
                            onTouchEnd={() => this.onTouchEnd()}
                        >↘</button>
                    </div>
                    <div
                        className="transform-demo-viewport"
                        style={{
                            ...viewport,
                        }}
                        ref={ref => this.viewDom = ref}
                    >
                        <div className="transform-demo-text center blue" >
                            +
                        </div>
                    </div>
                    <div
                        className="transform-demo-origin"
                        style={{
                            ...object,
                        }}
                    >   
                        <div
                            className="transform-demo-trans x line"
                            style={{
                                width: Math.abs(translateX),
                                transform: translateX > 0 ? 'scale(1)' : 'scale(-1)',
                            }}
                        />
                        <div
                            className="transform-demo-trans x"
                            style={{
                                left: `calc(50% + ${translateX}px)`,
                            }}
                        > { translateX }</div>
                        <div
                            className="transform-demo-trans y line"
                            style={{
                                height: Math.abs(translateY),
                                left: `calc(50% + ${translateX}px)`,
                                transform: translateY > 0 ? 'scale(1)' : 'scale(-1)',
                            }}
                        />
                        <div
                            className="transform-demo-trans y"
                            style={{
                                top: `calc(50% + ${translateY}px)`,
                                left: `calc(50% + ${translateX}px)`,
                            }}
                        > { translateY } </div>
                    </div>
                    <div
                        className="transform-demo-object shadow"
                        style={{
                            ...object,
                        }}
                        ref={ref => this.shadowDom = ref}
                    />
                    <div
                        className="transform-demo-object"
                        style={{
                            ...object,
                        }}
                        ref={ref => this.dom = ref}
                        onTouchStart={e => this.shadowTouchStart(e)}
                        onTouchMove={e => this.shadowTouchMove(e)}
                        onTouchEnd={e => this.shadowTouchEnd(e)}
                        onTouchCancel={e => this.shadowTouchEnd(e)}
                    >
                        <div
                            className="transform-demo-axis x"
                            style={{
                                top: originY,
                            }}
                        />
                        <div
                            className="transform-demo-axis y"
                            style={{
                                left: originX,
                            }}
                        />
                        <div
                            className="transform-demo-axis"
                            style={{
                                left: originX,
                                top: originY,
                            }}
                        >
                            ({ transformOrigin.join(',') })
                        </div>
                        <div className="transform-demo-text bottom" >
                            {`scale: ${scale}`}
                        </div>
                        <div className="transform-demo-text center" >
                            +
                        </div>
                        <div className="transform-demo-text top">
                            {`scale: ${scale}`}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
