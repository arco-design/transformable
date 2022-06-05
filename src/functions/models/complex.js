function convert(x, _init) {
    if (typeof x === 'number') {
        return {
            R: x,
            I: 0,
        };
    } else if (x.isComplex) {
        return x;
    } else {
        return {
            R: _init,
            I: 0,
        };
    }
}

export default class Complex {
    constructor (R, I = 0) {
        if (typeof R === 'number') {
            this.R = Number(R);
            this.I = Number(I);
        } else if (R.isComplex) {
            this.R = R.r();
            this.I = R.i();
        }
        this.isComplex = true;
    }
    
    valueOf() {
        return this.R.valueOf();
    }

    toString() {
        return `${this.R.toFixed(3)}+${this.I.toFixed(3)}i`;
    }

    isNaN() {
        return isNaN(this.R) || isNaN(this.I);
    }

    isReal() {
        return (this.I === 0) && !this.isNaN();
    }

    inRangeR(a, b) {
        return (this.R <= b) && (this.R >= a);
    }

    inRangeI(a, b) {
        return (this.I <= b) && (this.I >= a);
    }

    setR(r) {
        this.R = Number(r);
    }

    setI(i) {
        this.I = Number(i);
    }

    r() {
        return this.R;
    }

    i() {
        return this.I;
    }

    z() {
        return Math.sqrt((this.R ** 2) + (this.I ** 2));
    }

    theta() {
        const Z = this.z();
        return Math.acos(this.R / Z);
    }

    operatorAdd = x => {
        x = convert(x, 0);
        const R = this.R + x.R;
        const I = this.I + x.I;
        return new Complex(R, I);
    }

    operatorSub = x => {
        x = convert(x, 0);
        const R = this.R - x.R;
        const I = this.I - x.I;
        return new Complex(R, I);
    }

    operatorMul = x => {
        x = convert(x, 1);
        const R = this.R * x.R - this.I * x.I;
        const I = this.I * x.R + this.R * x.I;
        return new Complex(R, I);
    }

    operatorDiv = x => {
        x = convert(x, 1);
        const D = (x.R ** 2) + (x.I ** 2);
        const R = (this.R * x.R + this.I * x.I) / D;
        const I = (this.I * x.R - this.R * x.I) / D;
        return new Complex(R, I);
    }

    // x must be number
    operatorPow = x => {
        let Z = this.z();
        if (Z === 0) {
            return new Complex(0);
        }
        const theta = Math.acos(this.R / Z) * x;
        Z = Math.pow(Z, x);
        const R = Z * Math.cos(theta);
        const I = Z * Math.sin(theta);
        return new Complex(R, I);
    }
}