import { ComplexNumber } from "./ComplexNumber.ts";
import { RealMath } from "./RealMath.ts";
import { Type } from "./Type.ts";
import { Vector } from "./Vector.ts";
import { type Matrix, VectorUtils } from "./VectorUtils.ts";

/**
 * ComplexMath — the full complex-valued counterpart to {@link RealMath}:
 * arithmetic, exponentials/logarithms with branch selection, trigonometry,
 * numeric calculus, linear algebra and statistics over {@link ComplexNumber}s.
 *
 * Ported from Mallory's ActionScript `ComplexMath` (the author warned its
 * comments were copied from RealMath and are often wrong — they are rewritten
 * here). Method names are camelCased.
 *
 * Notable bug fixes from the AS3 original:
 *  - `divide`: the zero-divisor branches compared `alpha.ivalue` (lowercase v),
 *    which is always `undefined`, so the eight directed infinities were never
 *    returned. Fixed to `iValue` so the design actually works.
 *  - `power`: a zero base produced `NaN` (via `ln 0`); now handled directly, so
 *    `square(0)`, `squareRoot(0)` and e.g. `arcSine(0)` are correct.
 *  - `normalDistribution`: the AS3 code took the reciprocal of the *entire*
 *    expression, putting the exponential in the denominator (wrong sign); fixed
 *    to the correct PDF.
 *  - `integrateN`/`differentiateN`/`solveN`: same fixes as RealMath (midpoint
 *    rule, symmetric quotient, real Newton with numeric derivative).
 *  - `crossProduct`, `powerMatrix`, `invertMatrix` (pivoting), `sort` (comparator),
 *    `variance` (sample, N-1): same fixes as RealMath.
 *  - Constants `E`, `PI`, `PHI` use full precision rather than the truncated
 *    literals (`3.14159`, `2.71828183`) hard-coded in the AS3 source.
 */

type CNInput = ComplexNumber | number;
type CVec = Vector<ComplexNumber>;
type CMat = Matrix<ComplexNumber>;
type CUnary = (x: ComplexNumber) => ComplexNumber;

const cn = (x: CNInput): ComplexNumber => (x instanceof ComplexNumber ? x : new ComplexNumber(x));
const HSin = RealMath.hyperbolicSine;
const HCos = RealMath.hyperbolicCosine;

export class ComplexMath {
  static readonly Zero = new ComplexNumber(0, 0);
  static readonly One = new ComplexNumber(1, 0);
  static readonly I = new ComplexNumber(0, 1);
  static readonly E = new ComplexNumber(Math.E, 0);
  static readonly PI = new ComplexNumber(Math.PI, 0);
  static readonly PHI = new ComplexNumber((1 + Math.sqrt(5)) / 2, 0);
  static readonly NaCN = ComplexNumber.NaCN;

  // -- Chapter 1: unary ----------------------------------------------------

  static negative(alpha: CNInput): ComplexNumber {
    return cn(alpha).neg();
  }

  static reciprocal(alpha: CNInput): ComplexNumber {
    return cn(alpha).recip();
  }

  static conjugate(alpha: CNInput): ComplexNumber {
    return cn(alpha).conj();
  }

  static flip(alpha: CNInput): ComplexNumber {
    return cn(alpha).flip();
  }

  static magnitude(alpha: CNInput): number {
    const a = cn(alpha);
    return Math.hypot(a.value, a.iValue);
  }

  static angle(alpha: CNInput): number {
    const a = cn(alpha);
    return Math.atan2(a.iValue, a.value);
  }

  /** Alias of {@link angle}. */
  static argument(alpha: CNInput): number {
    return ComplexMath.angle(alpha);
  }

  static real(alpha: CNInput): number {
    return cn(alpha).value;
  }

  /** The imaginary part, returned (as in AS3) wrapped in a real ComplexNumber. */
  static imaginary(alpha: CNInput): ComplexNumber {
    return new ComplexNumber(cn(alpha).iValue);
  }

  /** Round tiny floating noise out of both components. */
  static identity(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return new ComplexNumber(RealMath.identity(a.value), RealMath.identity(a.iValue));
  }

  // -- Chapter 2: comparison -----------------------------------------------

  static equal(alpha: CNInput, beta: CNInput): boolean {
    const a = cn(alpha);
    const b = cn(beta);
    return a.value === b.value && a.iValue === b.iValue;
  }

  /** Lexicographic comparison: real part first, then imaginary. */
  static lexCompare(alpha: CNInput, beta: CNInput): number {
    const a = cn(alpha);
    const b = cn(beta);
    if (a.value > b.value) return 1;
    if (a.value < b.value) return -1;
    if (a.iValue > b.iValue) return 1;
    if (a.iValue < b.iValue) return -1;
    return 0;
  }

  static lexLessThan(alpha: CNInput, beta: CNInput): boolean {
    return ComplexMath.lexCompare(alpha, beta) === -1;
  }
  static lexGreaterThan(alpha: CNInput, beta: CNInput): boolean {
    return ComplexMath.lexCompare(alpha, beta) === 1;
  }
  static lexMaximum(alpha: CNInput, beta: CNInput): ComplexNumber {
    return ComplexMath.lexCompare(alpha, beta) >= 0 ? cn(alpha) : cn(beta);
  }
  static lexMinimum(alpha: CNInput, beta: CNInput): ComplexNumber {
    return ComplexMath.lexCompare(alpha, beta) <= 0 ? cn(beta) : cn(alpha);
  }

  /** Comparison by magnitude. */
  static magCompare(alpha: CNInput, beta: CNInput): number {
    const ma = ComplexMath.magnitude(alpha);
    const mb = ComplexMath.magnitude(beta);
    if (ma > mb) return 1;
    if (ma < mb) return -1;
    return 0;
  }

  static magEqual(alpha: CNInput, beta: CNInput): boolean {
    return ComplexMath.magCompare(alpha, beta) === 0;
  }
  static magLessThan(alpha: CNInput, beta: CNInput): boolean {
    return ComplexMath.magCompare(alpha, beta) === -1;
  }
  static magGreaterThan(alpha: CNInput, beta: CNInput): boolean {
    return ComplexMath.magCompare(alpha, beta) === 1;
  }
  static magMaximum(alpha: CNInput, beta: CNInput): ComplexNumber {
    return ComplexMath.magCompare(alpha, beta) >= 0 ? cn(alpha) : cn(beta);
  }
  static magMinimum(alpha: CNInput, beta: CNInput): ComplexNumber {
    return ComplexMath.magCompare(alpha, beta) <= 0 ? cn(beta) : cn(alpha);
  }

  /** Nonzero real part, zero imaginary part. */
  static strictlyReal(alpha: CNInput): boolean {
    const a = cn(alpha);
    return a.value !== 0 && a.iValue === 0;
  }
  /** Zero real part, nonzero imaginary part. */
  static strictlyImaginary(alpha: CNInput): boolean {
    const a = cn(alpha);
    return a.value === 0 && a.iValue !== 0;
  }
  /** Both parts nonzero. */
  static strictlyComplex(alpha: CNInput): boolean {
    const a = cn(alpha);
    return a.value !== 0 && a.iValue !== 0;
  }

  // -- Chapter 3: binary ---------------------------------------------------

  static add(alpha: CNInput = 0, beta: CNInput = 0): ComplexNumber {
    const a = cn(alpha);
    const b = cn(beta);
    return new ComplexNumber(a.value + b.value, a.iValue + b.iValue);
  }

  static multiply(alpha: CNInput = 1, beta: CNInput = 1): ComplexNumber {
    const a = cn(alpha);
    const b = cn(beta);
    return new ComplexNumber(a.value * b.value - a.iValue * b.iValue, a.value * b.iValue + a.iValue * b.value);
  }

  static subtract(alpha: CNInput = 0, beta: CNInput = 0): ComplexNumber {
    const a = cn(alpha);
    const b = cn(beta);
    return new ComplexNumber(a.value - b.value, a.iValue - b.iValue);
  }

  /** Division, returning one of the eight directed infinities on a zero divisor. */
  static divide(alpha: CNInput = 1, beta: CNInput = 1): ComplexNumber {
    const a = cn(alpha);
    const b = cn(beta);
    if (b.value === 0 && b.iValue === 0) {
      if (a.value > 0) {
        if (a.iValue === 0) return ComplexNumber.PositiveInfinity;
        if (a.iValue > 0) return ComplexNumber.InfinityQ1;
        return ComplexNumber.InfinityQ4;
      }
      if (a.value < 0) {
        if (a.iValue === 0) return ComplexNumber.NegativeInfinity;
        if (a.iValue > 0) return ComplexNumber.InfinityQ2;
        return ComplexNumber.InfinityQ3;
      }
      if (a.iValue === 0) return ComplexNumber.NaCN;
      if (a.iValue > 0) return ComplexNumber.PositiveInfinityI;
      return ComplexNumber.NegativeInfinityI;
    }
    return ComplexMath.multiply(a, ComplexMath.reciprocal(b));
  }

  // -- Chapter 4: exponential / logarithmic --------------------------------

  static power(alpha: CNInput, beta: CNInput = 1, selector = 0): ComplexNumber {
    const a = cn(alpha);
    const b = cn(beta);
    // Handle a zero base directly (bug fix: ln 0 otherwise poisons the result).
    if (a.value === 0 && a.iValue === 0) {
      if (b.value === 0 && b.iValue === 0) return new ComplexNumber(1, 0);
      if (b.value > 0) return new ComplexNumber(0, 0);
      return ComplexNumber.NaCN;
    }
    const newPow = ComplexMath.multiply(b, ComplexMath.selectedNaturalLogarithm(a, selector));
    return ComplexMath.power2(ComplexMath.E, newPow);
  }

  private static power2(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
    if (ComplexMath.equal(a, ComplexMath.Zero) && !ComplexMath.equal(b, ComplexMath.Zero)) {
      return new ComplexNumber(0, 0);
    }
    const mag = ComplexMath.magnitude(a);
    const ang = ComplexMath.angle(a);
    const c = b.value;
    const d = b.iValue;
    const multiplier = mag ** c / Math.E ** (d * ang);
    const cospart = multiplier * Math.cos(d * Math.log(mag) + c * ang);
    const sinpart = multiplier * Math.sin(d * Math.log(mag) + c * ang);
    return ComplexMath.identity(new ComplexNumber(cospart, sinpart));
  }

  static square(alpha: CNInput): ComplexNumber {
    return ComplexMath.power(alpha, 2);
  }

  static squareRoot(alpha: CNInput): ComplexNumber {
    return ComplexMath.power(alpha, 0.5);
  }

  static logarithm(alpha: CNInput, base: CNInput = Math.E, selectA = 0, selectB = 0): ComplexNumber {
    return ComplexMath.identity(
      ComplexMath.divide(
        ComplexMath.selectedNaturalLogarithm(alpha, selectA),
        ComplexMath.selectedNaturalLogarithm(base, selectB),
      ),
    );
  }

  private static selectedNaturalLogarithm(alpha: CNInput, selector = 0): ComplexNumber {
    const mag = ComplexMath.magnitude(alpha);
    const ang = ComplexMath.angle(alpha);
    return ComplexMath.identity(new ComplexNumber(Math.log(mag), ang + 2 * Math.PI * selector));
  }

  // -- Chapter 5: trigonometry ---------------------------------------------

  static sine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return new ComplexNumber(
      RealMath.roundTo(Math.sin(a.value) * HCos(a.iValue)),
      RealMath.roundTo(Math.cos(a.value) * HSin(a.iValue)),
    );
  }

  static cosine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return new ComplexNumber(
      RealMath.roundTo(Math.cos(a.value) * HCos(a.iValue)),
      RealMath.roundTo(-Math.sin(a.value) * HSin(a.iValue)),
    );
  }

  static tangent(alpha: CNInput): ComplexNumber {
    return ComplexMath.divide(ComplexMath.sine(alpha), ComplexMath.cosine(alpha));
  }
  static cosecant(alpha: CNInput): ComplexNumber {
    return ComplexMath.reciprocal(ComplexMath.sine(alpha));
  }
  static secant(alpha: CNInput): ComplexNumber {
    return ComplexMath.reciprocal(ComplexMath.cosine(alpha));
  }
  static cotangent(alpha: CNInput): ComplexNumber {
    return ComplexMath.divide(ComplexMath.cosine(alpha), ComplexMath.sine(alpha));
  }

  static hyperbolicSine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return new ComplexNumber(
      RealMath.roundTo(HSin(a.value) * Math.cos(a.iValue)),
      RealMath.roundTo(HCos(a.value) * Math.sin(a.iValue)),
    );
  }

  static hyperbolicCosine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return new ComplexNumber(
      RealMath.roundTo(HCos(a.value) * Math.cos(a.iValue)),
      RealMath.roundTo(HSin(a.value) * Math.sin(a.iValue)),
    );
  }

  static hyperbolicTangent(alpha: CNInput): ComplexNumber {
    return ComplexMath.divide(ComplexMath.hyperbolicSine(alpha), ComplexMath.hyperbolicCosine(alpha));
  }
  static hyperbolicCosecant(alpha: CNInput): ComplexNumber {
    return ComplexMath.reciprocal(ComplexMath.hyperbolicSine(alpha));
  }
  static hyperbolicSecant(alpha: CNInput): ComplexNumber {
    return ComplexMath.reciprocal(ComplexMath.hyperbolicCosine(alpha));
  }
  static hyperbolicCotangent(alpha: CNInput): ComplexNumber {
    return ComplexMath.divide(ComplexMath.hyperbolicCosine(alpha), ComplexMath.hyperbolicSine(alpha));
  }

  static arcSine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.multiply(
      ComplexMath.I.neg(),
      ComplexMath.logarithm(
        ComplexMath.add(
          ComplexMath.multiply(ComplexMath.I, a),
          ComplexMath.squareRoot(ComplexMath.subtract(1, ComplexMath.square(a))),
        ),
      ),
    );
  }

  static arcCosine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.multiply(
      ComplexMath.I.neg(),
      ComplexMath.logarithm(ComplexMath.add(a, ComplexMath.squareRoot(ComplexMath.subtract(ComplexMath.square(a), 1)))),
    );
  }

  static arcTangent(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.multiply(
      ComplexMath.divide(ComplexMath.I, 2),
      ComplexMath.subtract(
        ComplexMath.logarithm(ComplexMath.subtract(1, ComplexMath.multiply(ComplexMath.I, a))),
        ComplexMath.logarithm(ComplexMath.add(1, ComplexMath.multiply(ComplexMath.I, a))),
      ),
    );
  }

  static arcSecant(alpha: CNInput): ComplexNumber {
    return ComplexMath.arcCosine(cn(alpha).recip());
  }
  static arcCosecant(alpha: CNInput): ComplexNumber {
    return ComplexMath.arcSine(cn(alpha).recip());
  }
  static arcCotangent(alpha: CNInput): ComplexNumber {
    return ComplexMath.arcTangent(cn(alpha).recip());
  }

  static arcHyperbolicSine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.logarithm(ComplexMath.add(a, ComplexMath.squareRoot(ComplexMath.add(ComplexMath.square(a), 1))));
  }
  static arcHyperbolicCosine(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.logarithm(
      ComplexMath.add(a, ComplexMath.squareRoot(ComplexMath.subtract(ComplexMath.square(a), 1))),
    );
  }
  static arcHyperbolicTangent(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.logarithm(
      ComplexMath.divide(
        ComplexMath.squareRoot(ComplexMath.subtract(1, ComplexMath.square(a))),
        ComplexMath.subtract(1, a),
      ),
    );
  }
  static arcHyperbolicSecant(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.logarithm(
      ComplexMath.divide(ComplexMath.add(1, ComplexMath.squareRoot(ComplexMath.subtract(1, ComplexMath.square(a)))), a),
    );
  }
  static arcHyperbolicCosecant(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.logarithm(
      ComplexMath.divide(ComplexMath.subtract(1, ComplexMath.squareRoot(ComplexMath.add(1, ComplexMath.square(a)))), a),
    );
  }
  static arcHyperbolicCotangent(alpha: CNInput): ComplexNumber {
    const a = cn(alpha);
    return ComplexMath.logarithm(
      ComplexMath.divide(
        ComplexMath.squareRoot(ComplexMath.subtract(ComplexMath.square(a), 1)),
        ComplexMath.subtract(a, 1),
      ),
    );
  }

  // -- Chapter 7: series / calculus ----------------------------------------

  static sumSeries(unaryOperation: (x: number) => ComplexNumber, start = 0, end = 0): ComplexNumber {
    return ComplexMath.sum(
      VectorUtils.transform(VectorUtils.arithmeticSequence(cn(start).value, cn(end).value), unaryOperation),
    );
  }

  static productSeries(unaryOperation: (x: number) => ComplexNumber, start = 0, end = 0): ComplexNumber {
    return ComplexMath.product(
      VectorUtils.transform(VectorUtils.arithmeticSequence(cn(start).value, cn(end).value), unaryOperation),
    );
  }

  /** Newton–Raphson root finder (bug fix: numeric derivative; bounded loop). */
  static solveN(
    unaryOperation: CUnary,
    target: CNInput,
    desiredAccuracy: CNInput = 0.01,
    guess: CNInput = 0,
    maxIterations = 10000,
  ): ComplexNumber {
    let x = cn(guess);
    const tgt = cn(target);
    for (let i = 0; i < maxIterations; i++) {
      const difference = ComplexMath.subtract(unaryOperation(x), tgt);
      if (!ComplexMath.magGreaterThan(difference, desiredAccuracy)) return x;
      // numeric derivative via a small real step
      const h = 1e-6;
      const slope = ComplexMath.divide(
        ComplexMath.subtract(unaryOperation(ComplexMath.add(x, h)), unaryOperation(ComplexMath.subtract(x, h))),
        2 * h,
      );
      if (slope.value === 0 && slope.iValue === 0) break;
      x = ComplexMath.subtract(x, ComplexMath.divide(difference, slope));
    }
    return x;
  }

  /** Numeric integral via the midpoint rule (bug fix, as in RealMath). */
  static integrateN(
    unaryOperation: CUnary,
    lowerLimit: CNInput,
    upperLimit: CNInput,
    interval: CNInput = 0.01,
  ): ComplexNumber {
    const step = cn(interval);
    if (!ComplexMath.magGreaterThan(step, 0)) return ComplexNumber.NaCN;
    let result = ComplexMath.Zero;
    let x = cn(lowerLimit);
    const upper = cn(upperLimit);
    while (ComplexMath.lexLessThan(x, upper)) {
      result = ComplexMath.add(result, unaryOperation(ComplexMath.add(x, ComplexMath.divide(step, 2))));
      x = ComplexMath.add(x, step);
    }
    return ComplexMath.multiply(step, result);
  }

  /** Numeric derivative via the symmetric difference quotient (bug fix). */
  static differentiateN(unaryOperation: CUnary, point: CNInput, limit: CNInput = 0.01): ComplexNumber {
    const h = cn(limit);
    if (!ComplexMath.magGreaterThan(h, 0)) return ComplexNumber.NaCN;
    const p = cn(point);
    return ComplexMath.divide(
      ComplexMath.subtract(unaryOperation(ComplexMath.add(p, h)), unaryOperation(ComplexMath.subtract(p, h))),
      ComplexMath.multiply(2, h),
    );
  }

  // -- Chapter 9: probability ----------------------------------------------

  static zScore(x: CNInput, mean: CNInput = 0, sDev: CNInput = 1): ComplexNumber {
    return ComplexMath.divide(ComplexMath.subtract(x, mean), sDev);
  }

  static invertZScore(z: CNInput, mean: CNInput = 0, sDev: CNInput = 1): ComplexNumber {
    return ComplexMath.add(ComplexMath.multiply(z, sDev), mean);
  }

  /**
   * Normal PDF closure (bug fix: the AS3 code reciprocated the whole expression,
   * pushing the exponential into the denominator and flipping its sign).
   */
  static normalDistribution(mean: CNInput, sDev: CNInput): CUnary {
    return (x: ComplexNumber) =>
      ComplexMath.multiply(
        ComplexMath.reciprocal(ComplexMath.multiply(sDev, Math.sqrt(2 * Math.PI))),
        ComplexMath.power(
          ComplexMath.E,
          ComplexMath.multiply(-0.5, ComplexMath.square(ComplexMath.zScore(x, mean, sDev))),
        ),
      );
  }

  static standardNormalDistribution(x: CNInput): ComplexNumber {
    return ComplexMath.normalDistribution(0, 1)(cn(x));
  }

  static normalProbability(
    x: CNInput,
    mean: CNInput,
    sDev: CNInput,
    negativeInfinityApproximation: CNInput = -5,
    integrationInterval: CNInput = 0.0001,
  ): ComplexNumber {
    return ComplexMath.integrateN(
      ComplexMath.normalDistribution(mean, sDev),
      negativeInfinityApproximation,
      x,
      integrationInterval,
    );
  }

  static standardNormalProbability(
    z: CNInput,
    negativeInfinityApproximation: CNInput = -5,
    interval: CNInput = 0.0001,
  ): ComplexNumber {
    return ComplexMath.integrateN(ComplexMath.standardNormalDistribution, negativeInfinityApproximation, z, interval);
  }

  // -- Chapter 8: precision & randomness -----------------------------------

  static roundTo(num: CNInput, precision = 10): ComplexNumber {
    const a = cn(num);
    return new ComplexNumber(RealMath.roundTo(a.value, precision), RealMath.roundTo(a.iValue, precision));
  }

  static random(r1 = 1, r2 = 0, i1 = 1, i2 = 0, _inclusive = true): ComplexNumber {
    const low = Math.min(r1, r2);
    const high = Math.max(r1, r2);
    const iLow = Math.min(i1, i2);
    const iHigh = Math.max(i1, i2);
    return new ComplexNumber(low + Math.random() * (high - low), iLow + Math.random() * (iHigh - iLow));
  }

  static randomOrg(lower = 0, upper = 1, inclusive = true, fallback = true): ComplexNumber {
    if (fallback) return ComplexMath.random(lower, upper, lower, upper, inclusive);
    return ComplexMath.Zero;
  }

  static jitter(a: CNInput, magnitude = 0.1): ComplexNumber {
    const z = cn(a);
    return new ComplexNumber(
      z.value + (2 * Math.random() - 1) * magnitude,
      z.iValue + (2 * Math.random() - 1) * magnitude,
    );
  }

  // -- Part II Chapter 1: vectors ------------------------------------------

  static addVector(alpha: CVec, beta: CVec): CVec {
    return VectorUtils.combine(alpha, beta, ComplexMath.add) as CVec;
  }

  static scaleVector(alpha: CVec, scalar: CNInput): CVec {
    return VectorUtils.transform(alpha, (x) => ComplexMath.multiply(scalar, x));
  }

  static negativeVector(alpha: CVec): CVec {
    return ComplexMath.scaleVector(alpha, -1);
  }

  static subtractVector(alpha: CVec, beta: CVec): CVec {
    return ComplexMath.addVector(alpha, ComplexMath.negativeVector(beta));
  }

  static dotProduct(alpha: CVec, beta: CVec): ComplexNumber {
    const collapsable = VectorUtils.combine(alpha, beta, ComplexMath.multiply, ComplexMath.Zero) as CVec;
    return VectorUtils.collapse(collapsable, ComplexMath.add) as ComplexNumber;
  }

  /** 3D cross product (bug fix: index 2 for z, presence not truthiness). */
  static crossProduct(alpha: CVec, beta: CVec): CVec {
    const a = [ComplexMath.Zero, ComplexMath.Zero, ComplexMath.Zero];
    const b = [ComplexMath.Zero, ComplexMath.Zero, ComplexMath.Zero];
    for (let idx = 0; idx < 3; idx++) {
      if (idx < alpha.length && alpha[idx] != null) a[idx] = alpha[idx] as ComplexNumber;
      if (idx < beta.length && beta[idx] != null) b[idx] = beta[idx] as ComplexNumber;
    }
    const i = ComplexMath.subtract(ComplexMath.multiply(a[1], b[2]), ComplexMath.multiply(a[2], b[1]));
    const j = ComplexMath.subtract(ComplexMath.multiply(a[2], b[0]), ComplexMath.multiply(a[0], b[2]));
    const k = ComplexMath.subtract(ComplexMath.multiply(a[0], b[1]), ComplexMath.multiply(a[1], b[0]));
    return Vector.fromArray([i, j, k]);
  }

  static kroneckerProduct(A: CVec, B: CVec): CVec {
    let kronecker = VectorUtils.constantVector(A.length, null as unknown) as Vector<unknown>;
    kronecker = VectorUtils.fillByIndex(kronecker, (i) => ComplexMath.scaleVector(B, A[i] as ComplexNumber));
    return VectorUtils.flattenSDLevels(kronecker, 2) as CVec;
  }

  static distanceVector(alpha: CVec, beta: CVec, norm: CNInput = 2): ComplexNumber {
    return ComplexMath.pNorm(ComplexMath.subtractVector(alpha, beta), norm);
  }

  static pNorm(alpha: CVec, norm: CNInput = 2): ComplexNumber {
    const p = cn(norm);
    if (p.value === 0) {
      return ComplexMath.maximum(VectorUtils.transform(alpha, (x) => new ComplexNumber(ComplexMath.magnitude(x))));
    }
    const summable = VectorUtils.transform(alpha, (x) => ComplexMath.power(ComplexMath.magnitude(x), p.value));
    return ComplexMath.power(ComplexMath.sum(summable), 1 / p.value);
  }

  static magnitudeVector(alpha: CVec): ComplexNumber {
    return ComplexMath.pNorm(alpha, 2);
  }

  static angleBetween(alpha: CVec, beta: CVec): ComplexNumber {
    return ComplexMath.arcCosine(
      ComplexMath.divide(
        ComplexMath.dotProduct(alpha, beta),
        ComplexMath.multiply(ComplexMath.magnitudeVector(alpha), ComplexMath.magnitudeVector(beta)),
      ),
    );
  }

  // -- Part II Chapter 2: matrices -----------------------------------------

  static generateIdentity(height: CNInput = 1, width: CNInput = 1): CMat {
    return VectorUtils.generateIdentity(cn(height).value, cn(width).value, ComplexMath.One, ComplexMath.Zero);
  }

  static addMatrix(alpha: CMat, beta: CMat): CMat {
    return VectorUtils.combine(alpha, beta, ComplexMath.addVector) as CMat;
  }

  static scaleMatrix(alpha: CMat, scalar: CNInput): CMat {
    return VectorUtils.transformEndNodes(alpha, (x) => ComplexMath.multiply(scalar, x as ComplexNumber)) as CMat;
  }

  static negativeMatrix(alpha: CMat): CMat {
    return ComplexMath.scaleMatrix(alpha, -1);
  }

  static subtractMatrix(alpha: CMat, beta: CMat): CMat {
    return ComplexMath.addMatrix(alpha, ComplexMath.negativeMatrix(beta));
  }

  static scaleRow(alpha: CMat, index = 0, scalar: CNInput = 1): CMat {
    const newM = alpha.clone();
    return VectorUtils.rowSet(newM, ComplexMath.scaleVector(newM[index] as CVec, scalar), index);
  }

  static scaleColumn(alpha: CMat, index = 0, scalar: CNInput = 1): CMat {
    return VectorUtils.transpose(ComplexMath.scaleRow(alpha, index, scalar));
  }

  static trace(alpha: CMat): ComplexNumber {
    return VectorUtils.collapse(VectorUtils.diagonal(alpha), ComplexMath.add) as ComplexNumber;
  }

  static conjugateMatrix(m: CMat): CMat {
    return VectorUtils.fillMatrixByIndex(m, (i, j) => ComplexMath.conjugate((m[i] as CVec)[j] as ComplexNumber));
  }

  static kroneckerMatrixProduct(alpha: CMat, beta: CMat): CMat {
    let kronecker = VectorUtils.constantMatrix(
      VectorUtils.height(alpha),
      VectorUtils.width(alpha),
      null as unknown,
    ) as Matrix<unknown>;
    kronecker = VectorUtils.fillMatrixByIndex(kronecker, (i, j) =>
      ComplexMath.scaleMatrix(beta, (alpha[i] as CVec)[j] as ComplexNumber),
    );
    return VectorUtils.breakBlock(kronecker as Matrix<CMat>);
  }

  static multiplyMatrix(alpha: CMat, beta: CMat): CMat {
    const kroneckerList = new Vector<CMat>();
    for (let i = 0; i < VectorUtils.width(alpha); i++) {
      kroneckerList.push(
        ComplexMath.kroneckerMatrixProduct(VectorUtils.getColumn(alpha, i), VectorUtils.getRow(beta, i)),
      );
    }
    return VectorUtils.collapse(kroneckerList, ComplexMath.addMatrix) as CMat;
  }

  /** Integer matrix power (bug fix: actually accumulates the factors). */
  static powerMatrix(alpha: CMat, power = 1): CMat {
    if (power === 0) return ComplexMath.generateIdentity(VectorUtils.height(alpha), VectorUtils.width(alpha));
    const base = power > 0 ? alpha.clone() : ComplexMath.invertMatrix(alpha);
    const powerList = new Vector<CMat>();
    for (let i = 0; i < Math.abs(power); i++) powerList.push(base.clone());
    return VectorUtils.collapse(powerList, ComplexMath.multiplyMatrix) as CMat;
  }

  static determinant(alpha: CMat): ComplexNumber {
    if (VectorUtils.width(alpha) !== VectorUtils.height(alpha)) return ComplexMath.Zero;
    if (VectorUtils.width(alpha) < 2) return (alpha[0] as CVec)[0] as ComplexNumber;
    const detList = new Vector<ComplexNumber>();
    for (let i = 0; i < VectorUtils.width(alpha); i++) {
      const temp = VectorUtils.columnRemoved(VectorUtils.rowRemoved(alpha, 0), i);
      const entry = (alpha[0] as CVec)[i] as ComplexNumber;
      const signed = i % 2 === 0 ? entry : entry.neg();
      detList.push(ComplexMath.multiply(signed, ComplexMath.determinant(temp)));
    }
    return VectorUtils.collapse(detList, ComplexMath.add) as ComplexNumber;
  }

  static permanent(alpha: CMat): ComplexNumber {
    if (VectorUtils.width(alpha) < 2) return (alpha[0] as CVec)[0] as ComplexNumber;
    const detList = new Vector<ComplexNumber>();
    for (let i = 0; i < VectorUtils.width(alpha); i++) {
      const temp = VectorUtils.columnRemoved(VectorUtils.rowRemoved(alpha, 0), i);
      detList.push(ComplexMath.multiply((alpha[0] as CVec)[i] as ComplexNumber, ComplexMath.permanent(temp)));
    }
    return VectorUtils.collapse(detList, ComplexMath.add) as ComplexNumber;
  }

  /** Matrix inverse by Gauss-Jordan with partial pivoting (bug fix). */
  static invertMatrix(alpha: CMat, checkDeterminant = true): CMat {
    const n = VectorUtils.height(alpha);
    const w = VectorUtils.width(alpha);
    if (checkDeterminant && ComplexMath.equal(ComplexMath.determinant(alpha), ComplexMath.Zero)) {
      return VectorUtils.constantMatrix(n, w, ComplexMath.Zero);
    }

    const mat: ComplexNumber[][] = [...alpha].map((row) => [...(row as CVec)].map((z) => new ComplexNumber(z)));
    const inv: ComplexNumber[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => new ComplexNumber(i === j ? 1 : 0, 0)),
    );

    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) {
        if (ComplexMath.magnitude(mat[r][col]) > ComplexMath.magnitude(mat[pivot][col])) pivot = r;
      }
      if (pivot !== col) {
        [mat[col], mat[pivot]] = [mat[pivot], mat[col]];
        [inv[col], inv[pivot]] = [inv[pivot], inv[col]];
      }
      const p = mat[col][col];
      if (p.value === 0 && p.iValue === 0) continue;
      for (let k = 0; k < n; k++) {
        mat[col][k] = ComplexMath.divide(mat[col][k], p);
        inv[col][k] = ComplexMath.divide(inv[col][k], p);
      }
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const f = mat[r][col];
        for (let k = 0; k < n; k++) {
          mat[r][k] = ComplexMath.subtract(mat[r][k], ComplexMath.multiply(f, mat[col][k]));
          inv[r][k] = ComplexMath.subtract(inv[r][k], ComplexMath.multiply(f, inv[col][k]));
        }
      }
    }
    return Vector.fromArray(inv.map((row) => Vector.fromArray(row)));
  }

  // -- Part II Chapter 3: statistics ---------------------------------------

  static sort(list: CVec, sortLex = true, ascending = true): CVec {
    const comparator = sortLex ? ComplexMath.lexCompare : ComplexMath.magCompare;
    const sorted = list.clone().sort((a, b) => comparator(a, b)) as CVec;
    return ascending ? sorted : sorted.reversed();
  }

  static minimum(list: CVec): ComplexNumber {
    return ComplexMath.sort(list, true, true)[0] as ComplexNumber;
  }

  static maximum(list: CVec): ComplexNumber {
    return ComplexMath.sort(list, true, false)[0] as ComplexNumber;
  }

  static percentile(list: CVec, n: CNInput): ComplexNumber {
    const ordered = ComplexMath.sort(list);
    const theIndex = cn(n).value * (ordered.length + 1);
    if (theIndex === Math.floor(theIndex)) {
      return new ComplexNumber(ordered[theIndex - 1] as ComplexNumber);
    }
    return ComplexMath.divide(
      ComplexMath.add(
        ordered[Math.floor(theIndex - 1)] as ComplexNumber,
        ordered[Math.ceil(theIndex - 1)] as ComplexNumber,
      ),
      2,
    );
  }

  static median(list: CVec): ComplexNumber {
    return ComplexMath.percentile(list, 0.5);
  }
  static q1(list: CVec): ComplexNumber {
    return ComplexMath.percentile(list, 0.25);
  }
  static q3(list: CVec): ComplexNumber {
    return ComplexMath.percentile(list, 0.75);
  }

  static fiveNumberSummary(list: CVec): CVec {
    return Vector.fromArray([
      ComplexMath.minimum(list),
      ComplexMath.q1(list),
      ComplexMath.median(list),
      ComplexMath.q3(list),
      ComplexMath.maximum(list),
    ]);
  }

  static sum(list: CVec): ComplexNumber {
    return VectorUtils.collapse(list, ComplexMath.add, ComplexMath.Zero) as ComplexNumber;
  }

  static product(list: CVec): ComplexNumber {
    return VectorUtils.collapse(list, ComplexMath.multiply, ComplexMath.One) as ComplexNumber;
  }

  static mean(list: CVec): ComplexNumber {
    return ComplexMath.divide(ComplexMath.sum(list), list.length);
  }

  /** Sample variance (bug fix: AS3 divided by N despite the `n<2 -> NaCN` guard). */
  static variance(list: CVec): ComplexNumber {
    if (list.length < 2) return ComplexNumber.NaCN;
    const theMean = ComplexMath.mean(list);
    let theSum = ComplexMath.Zero;
    for (const x of list) theSum = ComplexMath.add(theSum, ComplexMath.square(ComplexMath.subtract(x, theMean)));
    return ComplexMath.multiply(1 / (list.length - 1), theSum);
  }

  static standardDeviation(list: CVec): ComplexNumber {
    return ComplexMath.squareRoot(ComplexMath.variance(list));
  }

  /** Population variance (divides by N; complements the sample {@link variance}). */
  static populationVariance(list: CVec): ComplexNumber {
    if (list.length < 1) return ComplexNumber.NaCN;
    const theMean = ComplexMath.mean(list);
    let theSum = ComplexMath.Zero;
    for (const x of list) theSum = ComplexMath.add(theSum, ComplexMath.square(ComplexMath.subtract(x, theMean)));
    return ComplexMath.multiply(1 / list.length, theSum);
  }

  static populationStandardDeviation(list: CVec): ComplexNumber {
    return ComplexMath.squareRoot(ComplexMath.populationVariance(list));
  }

  static zScoreList(list: CVec): CVec {
    const m = ComplexMath.mean(list);
    const sd = ComplexMath.standardDeviation(list);
    return VectorUtils.transform(list, (x) => ComplexMath.zScore(x, m, sd));
  }

  static roundedList(list: CVec, precision: number): CVec {
    return VectorUtils.transform(list, (x) => ComplexMath.roundTo(x, precision));
  }

  static jitteredList(list: CVec, magnitude = 0.1): CVec {
    return VectorUtils.transform(list, (x) => ComplexMath.jitter(x, magnitude));
  }

  static isOutlier(list: CVec, value: CNInput, distance: CNInput = 1.5): boolean {
    const range = ComplexMath.multiply(distance, ComplexMath.interQuartileRange(list));
    return (
      ComplexMath.lexLessThan(value, ComplexMath.subtract(ComplexMath.q1(list), range)) ||
      ComplexMath.lexGreaterThan(value, ComplexMath.add(ComplexMath.q3(list), range))
    );
  }

  static interQuartileRange(list: CVec): ComplexNumber {
    return ComplexMath.subtract(ComplexMath.q3(list), ComplexMath.q1(list));
  }

  static outliers(list: CVec, distance: CNInput = 1.5): CVec {
    return VectorUtils.filter(list, (x) => ComplexMath.isOutlier(list, x, distance));
  }

  static outliersRemoved(list: CVec, distance: CNInput = 1.5): CVec {
    return VectorUtils.filter(list, (x) => !ComplexMath.isOutlier(list, x, distance));
  }

  static correlation(x: CVec, y: CVec): ComplexNumber {
    if (x.length < 2) return ComplexNumber.NaCN;
    const xMean = ComplexMath.mean(x);
    const yMean = ComplexMath.mean(y);
    const xSD = ComplexMath.standardDeviation(x);
    const ySD = ComplexMath.standardDeviation(y);
    let theSum = ComplexMath.Zero;
    for (let i = 0; i < x.length; i++) {
      theSum = ComplexMath.add(
        theSum,
        ComplexMath.multiply(
          ComplexMath.divide(ComplexMath.subtract(x[i] as ComplexNumber, xMean), xSD),
          ComplexMath.divide(ComplexMath.subtract(y[i] as ComplexNumber, yMean), ySD),
        ),
      );
    }
    return ComplexMath.multiply(1 / (x.length - 1), theSum);
  }

  static linRegSlope(x: CVec, y: CVec): ComplexNumber {
    return ComplexMath.multiply(
      ComplexMath.correlation(x, y),
      ComplexMath.divide(ComplexMath.standardDeviation(y), ComplexMath.standardDeviation(x)),
    );
  }

  static linRegIntercept(x: CVec, y: CVec): ComplexNumber {
    return ComplexMath.subtract(
      ComplexMath.mean(y),
      ComplexMath.multiply(ComplexMath.linRegSlope(x, y), ComplexMath.mean(x)),
    );
  }

  static linearRegression(x: CVec, y: CVec): CVec {
    return Vector.fromArray([ComplexMath.linRegSlope(x, y), ComplexMath.linRegIntercept(x, y)]);
  }

  static linearRegressionFunction(x: CVec, y: CVec): CUnary {
    const slope = ComplexMath.linRegSlope(x, y);
    const intercept = ComplexMath.linRegIntercept(x, y);
    return (a: ComplexNumber) => ComplexMath.add(ComplexMath.multiply(slope, a), intercept);
  }

  // -- Part IV: generic polymorphic dispatch -------------------------------

  static addGeneric(x: unknown = 0, y: unknown = 0): unknown {
    const tx = Type.getType(x);
    const ty = Type.getType(y);
    if (tx === Type.NUMBER && ty === Type.NUMBER) return ComplexMath.add(x as CNInput, y as CNInput);
    if (tx === Type.MATRIX && ty === Type.MATRIX) return ComplexMath.addMatrix(x as CMat, y as CMat);
    if (tx === Type.VECTOR && ty === Type.VECTOR) return ComplexMath.addVector(x as CVec, y as CVec);
    return null;
  }

  static subtractGeneric(x: unknown = 0, y: unknown = 0): unknown {
    const tx = Type.getType(x);
    const ty = Type.getType(y);
    if (tx === Type.NUMBER && ty === Type.NUMBER) return ComplexMath.subtract(x as CNInput, y as CNInput);
    if (tx === Type.MATRIX && ty === Type.MATRIX) return ComplexMath.subtractMatrix(x as CMat, y as CMat);
    if (tx === Type.VECTOR && ty === Type.VECTOR) return ComplexMath.subtractVector(x as CVec, y as CVec);
    return null;
  }

  static multiplyGeneric(x: unknown = 0, y: unknown = 0): unknown {
    const tx = Type.getType(x);
    const ty = Type.getType(y);
    if (tx === Type.NUMBER && ty === Type.NUMBER) return ComplexMath.multiply(x as CNInput, y as CNInput);
    if (tx === Type.NUMBER && ty === Type.MATRIX) return ComplexMath.scaleMatrix(y as CMat, x as CNInput);
    if (tx === Type.MATRIX && ty === Type.NUMBER) return ComplexMath.scaleMatrix(x as CMat, y as CNInput);
    if (tx === Type.NUMBER && ty === Type.VECTOR) return ComplexMath.scaleVector(y as CVec, x as CNInput);
    if (tx === Type.VECTOR && ty === Type.NUMBER) return ComplexMath.scaleVector(x as CVec, y as CNInput);
    if (tx === Type.MATRIX && ty === Type.MATRIX) return ComplexMath.multiplyMatrix(x as CMat, y as CMat);
    return null;
  }
}
