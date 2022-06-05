import Complex from './models/complex';
function Sqrt(k) {
    if (k >= 0) {
        return Math.sqrt(k);
    } else {
        return new Complex(0, Math.sqrt(-k));
    }
}

const POW_3_1_2 = Math.sqrt(3);
const POW_2_1_3 = Math.pow(2, 1/3);
const I = Sqrt(-1);
const _I = (new Complex(0)).operatorSub(I);
const epsilon = 1e-12;

function getParam(T, x1, x2) {
    const a = -3*x1 + 3*x2 - 1;
    const b = -(2*x1 - x2) / a;
    const c = -9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2;
    const d = 3*a;
    const e = POW_2_1_3*d;
    const subDelta = 54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 162*x1**2 - 81*x2**2*x1 - 
        162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 54*x2**3 - 243*T*x2**2 - 27*T + 
        162*T*x2;
    const delta = 4*c**3 + subDelta**2;
    return [delta, subDelta, b, c, d, e];
}

export default function solveCubicBezier(T, x1, x2, firstAnswer = true) {
    'bpo enable'; // eslint disable line
    // const startTime = performance.now();
    if (x1 === x2 && x1 === 0) {
        return Math.pow(T, 1/3);
    }
    const [delta, subDelta, b, c, d, e] = getParam(T, x1, x2);
    const a = new Complex(Sqrt(delta) + subDelta) ** (1/3);
    const t1 = a/e - (new Complex(POW_2_1_3*c) / (a*d)) + b;
    const answers = [];
    if (delta <= epsilon) {
        const t2 = (I*POW_3_1_2 - 1)*a / (2*e) + (I*POW_3_1_2 + 1)*c / (a*e*POW_2_1_3) + b;
        const t3 = (_I*POW_3_1_2 - 1)*a / (2*e) + (_I*POW_3_1_2 + 1)*c / (a*e*POW_2_1_3) + b;
        // If the discriminant is greater than 0, there is a conjugate complex root, and if the discriminant is less than 0, the imaginary part is not 0, which is regarded as an accuracy error and is manually eliminated.
        [t1, t2, t3].forEach(k => {
            k.inRangeR(0, 1) && answers.push(k.r());
        })
        // Sort by error
        answers.sort();
    } else {
        answers.push(t1.r());
    }
    // console.log('solve', t1, t2, t3);
    // console.log('answers', answers);
    // console.log('cost', performance.now() - startTime, performance.now());
    return firstAnswer ? answers[0] : answers;
}

/*
{{t -> (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 162*x1**2 - 81*x2**2*x1 - 
                162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 54*x2**3 - 
        243*T*x2**2 - 27*T + 
                162*T*x2 + 
        Sqrt[4*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2)**3 + 
                    (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 162*x1**2 - 
             81*x2**2*x1 - 
                         162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 
             54*x2**3 - 243*T*x2**2 - 27*T + 
                         162*T*x2)**2])^(1/
        3)/(3*POW_2_1_3*(-3*x1 + 3*x2 - 1)) - 
         (2*x1 - x2)/(-3*x1 + 3*x2 - 1) - 
         (POW_2_1_3*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2))/(3*(-3*x1 + 
         3*x2 - 1)*
              (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 162*x1**2 - 
          81*x2**2*x1 - 
                   162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 54*x2**3 - 
          243*T*x2**2 - 27*T + 
                   162*T*x2 + 
          Sqrt[4*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2)**3 + 
                       (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 
               162*x1**2 - 81*x2**2*x1 - 
                            162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 
               54*x2**3 - 243*T*x2**2 - 
                            27*T + 162*T*x2)**2])^(1/3))}, 
   {t -> -(((1 - 
           I*Sqrt[3])*(54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 
            162*x1**2 - 
                      81*x2**2*x1 - 162*T*x1 + 486*T*x2*x1 - 
            81*x2*x1 + 54*x2**3 - 
                      243*T*x2**2 - 27*T + 162*T*x2 + 
                      Sqrt[4*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2)**3 + 
                          (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 
                 162*x1**2 - 81*x2**2*x1 - 
                               162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 
                 54*x2**3 - 243*T*x2**2 - 
                               27*T + 162*T*x2)**2])^(1/3))/(6*2^(1/
            3)*(-3*x1 + 3*x2 - 1))) - 
         (2*x1 - x2)/(-3*x1 + 3*x2 - 1) + 
         ((I*Sqrt[3] + 1)*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2))/
           (3*POW_2_2_3*(-3*x1 + 3*x2 - 
         1)*(54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 
                   162*x1**2 - 81*x2**2*x1 - 162*T*x1 + 486*T*x2*x1 - 
          81*x2*x1 + 
                   54*x2**3 - 243*T*x2**2 - 27*T + 162*T*x2 + 
                   Sqrt[4*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2)**3 + 
                       (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 
               162*x1**2 - 81*x2**2*x1 - 
                            162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 
               54*x2**3 - 243*T*x2**2 - 
                            27*T + 162*T*x2)**2])^(1/3))}, 
   {t -> -(((I*Sqrt[3] + 
           1)*(54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 162*x1**2 - 
                      81*x2**2*x1 - 162*T*x1 + 486*T*x2*x1 - 
            81*x2*x1 + 54*x2**3 - 
                      243*T*x2**2 - 27*T + 162*T*x2 + 
                      Sqrt[4*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2)**3 + 
                          (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 
                 162*x1**2 - 81*x2**2*x1 - 
                               162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 
                 54*x2**3 - 243*T*x2**2 - 
                               27*T + 162*T*x2)**2])^(1/3))/(6*2^(1/
            3)*(-3*x1 + 3*x2 - 1))) - 
         (2*x1 - x2)/(-3*x1 + 3*x2 - 
       1) + ((-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2)*
              (1 - I*Sqrt[3]))/(3*POW_2_2_3*(-3*x1 + 3*x2 - 1)*
              (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 162*x1**2 - 
          81*x2**2*x1 - 
                   162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 54*x2**3 - 
          243*T*x2**2 - 27*T + 
                   162*T*x2 + 
          Sqrt[4*(-9*x1**2 + 9*x2*x1 + 9*x1 - 9*x2**2)**3 + 
                       (54*x1**3 - 243*T*x1**2 - 81*x2*x1**2 + 
               162*x1**2 - 81*x2**2*x1 - 
                            162*T*x1 + 486*T*x2*x1 - 81*x2*x1 + 
               54*x2**3 - 243*T*x2**2 - 
                            27*T + 162*T*x2)**2])^(1/3))}}*/