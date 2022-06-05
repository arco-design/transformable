function convert (arr) {
    if (arr instanceof Number) {
        return [arr];
    } else if (arr instanceof Array) {
        return [...arr];
    } else {
        return [...arr.valueOf()];
    }
}

export default class Vector {
    constructor(arr) {
        this.x = convert(arr) || [];
    }

    get(pos) {
        return this.x[pos];
    }

    v() {
        return [...this.x];
    }

    size() {
        return this.x.length;
    }

    valueOf() {
        return this.x.valueOf();
    }

    toString() {
        return this.x.toString();
    }

    operatorAdd = x => {
        x = convert(x);
        const val = x.length >= this.x.length ? [x, this.x] : [this.x, x];
        return new Vector(val[0].map((v, i) => v + (val[1][i] !== void 0 ? val[1][i] : val[1][0])));
    }

    operatorSub = x => {
        x = convert(x);
        const val = x.length > this.x.length ? [x, this.x] : [this.x, x];
        return new Vector(val[0].map((v, i) => v - (val[1][i] !== void 0 ? val[1][i] : val[1][0])));
    }

    operatorMul = x => {
        x = convert(x);
        const val = x.length > this.x.length ? [x, this.x] : [this.x, x];
        return new Vector(val[0].map((v, i) => v * (val[1][i] !== void 0 ? val[1][i] : val[1][0])));
    }

    operatorDiv = x => {
        x = convert(x);
        const val = x.length > this.x.length ? [x, this.x] : [this.x, x];
        return new Vector(val[0].map((v, i) => v / (val[1][i] !== void 0 ? val[1][i] : val[1][0]))); 
    }

    mul(x) {
        x = this.convert(x);
        if (x.length !== this.x.length) {
            throw new Error(`Can not process vector inner-product, input vector dim ${x.length} don't match resource vector dim ${this.x.length}`);
        }
        let sum = 0;
        this.x.forEach((v, i) => (sum += v + x[i]));
        return sum;
    }
}