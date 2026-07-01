import { Vector } from "./Vector.ts";
import { VectorUtils, type Matrix } from "./VectorUtils.ts";
import { Type } from "./Type.ts";

/**
 * RealMath — arithmetic, trigonometry, numeric calculus, linear algebra and
 * statistics over real numbers. Ported from Mallory's ActionScript `RealMath`.
 *
 * Method names are camelCased. Callback parameters are properly typed. Bugs
 * fixed from the AS3 original are called out at each site; the notable ones:
 *  - `subtract` returned `a*b` (!).
 *  - `equal` ignored its tolerance argument (`Math.abs(a-b) <= 0`).
 *  - `sort` used the default *lexicographic* Array sort, corrupting every
 *    order statistic (`minimum`/`maximum`/`median`/percentiles).
 *  - `integrateN` used a nonsensical sample point and had an unreachable return.
 *  - `differentiateN` was a forward difference despite claiming to be symmetric.
 *  - `crossProduct` read index 3 for the z-component and used truthiness tests.
 *  - `powerMatrix` called a non-existent method and never actually multiplied.
 *  - `invertMatrix` had no pivoting (divide-by-zero on a zero pivot).
 *  - `variance` divided by N despite the `n<2 -> NaN` guard implying sample (N-1).
 */

type RVec = Vector<number>;
type RMat = Matrix<number>;
type Unary = (x: number) => number;

export class RealMath {
  static readonly Zero = 0;
  static readonly One = 1;
  static readonly E = Math.E;
  static readonly PI = Math.PI;
  static readonly PHI = 1.61803399;
  static readonly PositiveInfinity = Infinity;
  static readonly NegativeInfinity = -Infinity;

  // -- Chapter 1: utilities ------------------------------------------------

  static radiansToDegrees(r: number): number {
    return (180 / Math.PI) * r;
  }

  static degreesToRadians(d: number): number {
    return (Math.PI / 180) * d;
  }

  // -- Chapter 2: comparison -----------------------------------------------

  /** Equality within `distance` (bug fix: AS3 ignored the tolerance). */
  static equal(a: number, b: number, distance = 0): boolean {
    return Math.abs(a - b) <= distance;
  }

  static compare(a: number, b: number): number {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  }

  static lessThan(a: number, b: number): boolean {
    return a < b;
  }

  static greaterThan(a: number, b: number): boolean {
    return a > b;
  }

  // -- Chapter 3: unary ----------------------------------------------------

  static negative(a = 0): number {
    return -a;
  }

  static reciprocal(a = 1): number {
    return a === 0 ? NaN : 1 / a;
  }

  /** Round away tiny floating-point noise (rounds to 10 decimal places). */
  static identity(a = 1): number {
    return RealMath.roundTo(a);
  }

  // -- Chapter 4: binary ---------------------------------------------------

  static add(a = 0, b = 0): number {
    return a + b;
  }

  /** Subtraction (bug fix: AS3 returned `a*b`). */
  static subtract(a = 0, b = 0): number {
    return a - b;
  }

  static multiply(a = 1, b = 1): number {
    return a * b;
  }

  static divide(a = 1, b = 1): number {
    if (b === 0) {
      if (a > 0) return Infinity;
      if (a < 0) return -Infinity;
      return NaN;
    }
    return a / b;
  }

  // -- Chapter 5: exponential / logarithmic --------------------------------

  static power(a = 1, power = 1): number {
    return Math.pow(a, power);
  }

  static square(a = 1): number {
    return Math.pow(a, 2);
  }

  static squareRoot(a = 1): number {
    return Math.sqrt(a);
  }

  static logarithm(a = 1, base = Math.E): number {
    return Math.log(a) / Math.log(base);
  }

  // -- Chapter 6: trigonometry ---------------------------------------------

  static sine(a = 0): number {
    return RealMath.identity(Math.sin(a));
  }
  static cosine(a = 0): number {
    return RealMath.identity(Math.cos(a));
  }
  static tangent(a = 0): number {
    return RealMath.identity(Math.tan(a));
  }
  static cosecant(a = 0): number {
    return RealMath.identity(1 / Math.sin(a));
  }
  static secant(a = 0): number {
    return RealMath.identity(1 / Math.cos(a));
  }
  static cotangent(a = 0): number {
    return RealMath.identity(1 / Math.tan(a));
  }

  static hyperbolicSine(a: number): number {
    return RealMath.identity(0.5 * (Math.exp(a) - Math.exp(-a)));
  }
  static hyperbolicCosine(a: number): number {
    return RealMath.identity(0.5 * (Math.exp(a) + Math.exp(-a)));
  }
  static hyperbolicTangent(a: number): number {
    return RealMath.hyperbolicSine(a) / RealMath.hyperbolicCosine(a);
  }
  static hyperbolicCosecant(a: number): number {
    return 1 / RealMath.hyperbolicSine(a);
  }
  static hyperbolicSecant(a: number): number {
    return 1 / RealMath.hyperbolicCosine(a);
  }
  static hyperbolicCotangent(a: number): number {
    return RealMath.hyperbolicCosine(a) / RealMath.hyperbolicSine(a);
  }

  // -- Chapter 7: series, algebra, calculus --------------------------------

  static sumSeries(unaryOperation: Unary, start = 0, end = 0): number {
    return RealMath.sum(VectorUtils.transform(VectorUtils.arithmeticSequence(start, end), unaryOperation));
  }

  static productSeries(unaryOperation: Unary, start = 0, end = 0): number {
    return RealMath.product(VectorUtils.transform(VectorUtils.arithmeticSequence(start, end), unaryOperation));
  }

  /**
   * Newton–Raphson root finder for `unaryOperation(x) == target`.
   *
   * Bug fix: the AS3 version updated `guess -= (f(guess) - target)`, i.e. Newton
   * with an assumed derivative of 1 — it diverges for almost any nonlinear
   * function. Here the derivative is estimated numerically ({@link differentiateN})
   * so the iteration actually converges, and unbounded recursion is replaced by a
   * bounded loop.
   */
  static solveN(
    unaryOperation: Unary,
    target: number,
    desiredAccuracy = 0.01,
    guess = 0,
    maxIterations = 10000,
  ): number {
    let x = guess;
    for (let i = 0; i < maxIterations; i++) {
      const difference = unaryOperation(x) - target;
      if (Math.abs(difference) <= desiredAccuracy) return x;
      const slope = RealMath.differentiateN(unaryOperation, x, 1e-6);
      if (slope === 0 || !Number.isFinite(slope)) break;
      x = x - difference / slope;
    }
    return x;
  }

  /**
   * Numeric integral via the midpoint rule (bug fix: the AS3 code sampled at
   * `2*lowerLimit+interval` and had an unreachable return).
   */
  static integrateN(unaryOperation: Unary, lowerLimit: number, upperLimit: number, interval = 0.01): number {
    if (interval <= 0) return NaN;
    let result = 0;
    for (let x = lowerLimit; x < upperLimit; x += interval) {
      result += unaryOperation(x + interval / 2);
    }
    return interval * result;
  }

  /**
   * Numeric derivative via the symmetric difference quotient (bug fix: the AS3
   * code was a forward difference despite the "symmetric" comment).
   */
  static differentiateN(unaryOperation: Unary, point: number, limit = 0.01): number {
    if (limit <= 0) return NaN;
    return (unaryOperation(point + limit) - unaryOperation(point - limit)) / (2 * limit);
  }

  // -- Chapter 9: probability ----------------------------------------------

  static zScore(x: number, mean = 0, sDev = 1): number {
    return (x - mean) / sDev;
  }

  static invertZScore(z: number, mean = 0, sDev = 1): number {
    return z * sDev + mean;
  }

  static normalDistribution(mean: number, sDev: number): Unary {
    return (x: number) =>
      (1 / (sDev * Math.sqrt(2 * Math.PI))) * Math.pow(Math.E, -0.5 * Math.pow((x - mean) / sDev, 2));
  }

  static standardNormalDistribution(x: number): number {
    return RealMath.normalDistribution(0, 1)(x);
  }

  static normalProbability(
    x: number,
    mean: number,
    sDev: number,
    negativeInfinityApproximation = -5,
    integrationInterval = 0.0001,
  ): number {
    return RealMath.integrateN(RealMath.normalDistribution(mean, sDev), negativeInfinityApproximation, x, integrationInterval);
  }

  static standardNormalProbability(z: number, negativeInfinityApproximation = -5, interval = 0.0001): number {
    return RealMath.integrateN(RealMath.standardNormalDistribution, negativeInfinityApproximation, z, interval);
  }

  // -- Chapter 8: precision & randomness -----------------------------------

  /** Round to `precision` decimal places (replaces the buggy Flex NumberFormatter). */
  static roundTo(num: number, precision = 10): number {
    if (!Number.isFinite(num)) return num;
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }

  /** Uniform random in `[min(r1,r2), max(r1,r2)]`. */
  static random(r1 = 1, r2 = 0, _inclusive = true): number {
    const low = Math.min(r1, r2);
    const high = Math.max(r1, r2);
    return low + Math.random() * (high - low);
  }

  /** Placeholder for the random.org fetch; always falls back to {@link random}. */
  static randomOrg(lower = 0, upper = 1, inclusive = true, fallback = true): number {
    if (fallback) return RealMath.random(lower, upper, inclusive);
    return 0;
  }

  static jitter(a: number, magnitude = 0.1): number {
    return a + (2 * Math.random() - 1) * magnitude;
  }

  // -- Part II Chapter 1: vectors ------------------------------------------

  static addVector(alpha: RVec, beta: RVec): RVec {
    return VectorUtils.combine(alpha, beta, RealMath.add) as RVec;
  }

  static scaleVector(alpha: RVec, scalar: number): RVec {
    return VectorUtils.transform(alpha, (x) => RealMath.multiply(scalar, x));
  }

  static negativeVector(alpha: RVec): RVec {
    return RealMath.scaleVector(alpha, -1);
  }

  static subtractVector(alpha: RVec, beta: RVec): RVec {
    return RealMath.addVector(alpha, RealMath.negativeVector(beta));
  }

  static dotProduct(alpha: RVec, beta: RVec): number {
    const collapsable = VectorUtils.combine(alpha, beta, RealMath.multiply, 0) as RVec;
    return VectorUtils.collapse(collapsable, RealMath.add) as number;
  }

  /**
   * 3D cross product (bug fix: the AS3 code read index 3 for the z-component
   * and used truthiness tests that dropped legitimate zero components).
   */
  static crossProduct(alpha: RVec, beta: RVec): RVec {
    const a = [0, 0, 0];
    const b = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      if (i < alpha.length && alpha[i] != null) a[i] = alpha[i] as number;
      if (i < beta.length && beta[i] != null) b[i] = beta[i] as number;
    }
    const i = a[1] * b[2] - a[2] * b[1];
    const j = a[2] * b[0] - a[0] * b[2];
    const k = a[0] * b[1] - a[1] * b[0];
    return Vector.fromArray([i, j, k]);
  }

  static kroneckerProduct(A: RVec, B: RVec): RVec {
    let kronecker = VectorUtils.constantVector(A.length, null as unknown as number) as Vector<unknown>;
    kronecker = VectorUtils.fillByIndex(kronecker, (i) => RealMath.scaleVector(B, A[i] as number));
    return VectorUtils.flattenSDLevels(kronecker, 2) as RVec;
  }

  static distanceVector(alpha: RVec, beta: RVec, norm = 2): number {
    return RealMath.pNorm(RealMath.subtractVector(alpha, beta), norm);
  }

  static pNorm(alpha: RVec, norm = 2): number {
    if (norm === 0) return RealMath.maximum(VectorUtils.transform(alpha, Math.abs));
    const summable = VectorUtils.transform(alpha, (x) => Math.pow(Math.abs(x), norm));
    return Math.pow(RealMath.sum(summable), 1 / norm);
  }

  static magnitudeVector(alpha: RVec): number {
    return RealMath.pNorm(alpha, 2);
  }

  static angleBetween(alpha: RVec, beta: RVec): number {
    return Math.acos(
      RealMath.dotProduct(alpha, beta) / (RealMath.magnitudeVector(alpha) * RealMath.magnitudeVector(beta)),
    );
  }

  // -- Part II Chapter 2: matrices -----------------------------------------

  static generateIdentity(height = 1, width = 1): RMat {
    return VectorUtils.generateIdentity(height, width, 1, 0);
  }

  static addMatrix(alpha: RMat, beta: RMat): RMat {
    return VectorUtils.combine(alpha, beta, RealMath.addVector) as RMat;
  }

  static scaleMatrix(alpha: RMat, scalar: number): RMat {
    return VectorUtils.transformEndNodes(alpha, (x) => scalar * (x as number)) as RMat;
  }

  static negativeMatrix(alpha: RMat): RMat {
    return RealMath.scaleMatrix(alpha, -1);
  }

  static subtractMatrix(alpha: RMat, beta: RMat): RMat {
    return RealMath.addMatrix(alpha, RealMath.negativeMatrix(beta));
  }

  static scaleRow(alpha: RMat, index = 0, scalar = 1): RMat {
    const newM = alpha.clone();
    return VectorUtils.rowSet(newM, RealMath.scaleVector(newM[index] as RVec, scalar), index);
  }

  static scaleColumn(alpha: RMat, index = 0, scalar = 1): RMat {
    return VectorUtils.transpose(RealMath.scaleRow(alpha, index, scalar));
  }

  static trace(alpha: RMat): number {
    return VectorUtils.collapse(VectorUtils.diagonal(alpha), (a, b) => a + b) as number;
  }

  static kroneckerMatrixProduct(alpha: RMat, beta: RMat): RMat {
    let kronecker = VectorUtils.constantMatrix(
      VectorUtils.height(alpha),
      VectorUtils.width(alpha),
      null as unknown,
    ) as Matrix<unknown>;
    kronecker = VectorUtils.fillMatrixByIndex(kronecker, (i, j) =>
      RealMath.scaleMatrix(beta, (alpha[i] as RVec)[j] as number),
    );
    return VectorUtils.breakBlock(kronecker as Matrix<Matrix<number>>);
  }

  /**
   * Matrix product via the sum-of-outer-products identity
   * `A·B = Σₖ colₖ(A) ⊗ rowₖ(B)`. (The AS3 code did the same; despite
   * appearances it is a correct standard product.)
   */
  static multiplyMatrix(alpha: RMat, beta: RMat): RMat {
    const kroneckerList = new Vector<RMat>();
    for (let i = 0; i < VectorUtils.width(alpha); i++) {
      kroneckerList.push(
        RealMath.kroneckerMatrixProduct(VectorUtils.getColumn(alpha, i), VectorUtils.getRow(beta, i)),
      );
    }
    return VectorUtils.collapse(kroneckerList, RealMath.addMatrix) as RMat;
  }

  /** Integer matrix power (bug fix: the AS3 loop never actually pushed factors). */
  static powerMatrix(alpha: RMat, power = 1): RMat {
    if (power === 0) return RealMath.generateIdentity(VectorUtils.height(alpha), VectorUtils.width(alpha));
    const base = power > 0 ? alpha.clone() : RealMath.invertMatrix(alpha);
    const powerList = new Vector<RMat>();
    for (let i = 0; i < Math.abs(power); i++) powerList.push(base.clone());
    return VectorUtils.collapse(powerList, RealMath.multiplyMatrix) as RMat;
  }

  static determinant(alpha: RMat): number {
    if (VectorUtils.width(alpha) !== VectorUtils.height(alpha)) return 0;
    if (VectorUtils.width(alpha) < 2) return (alpha[0] as RVec)[0] as number;
    const detList = new Vector<number>();
    for (let i = 0; i < VectorUtils.width(alpha); i++) {
      const temp = VectorUtils.columnRemoved(VectorUtils.rowRemoved(alpha, 0), i);
      const sign = i % 2 === 0 ? 1 : -1;
      detList.push(sign * ((alpha[0] as RVec)[i] as number) * RealMath.determinant(temp));
    }
    return VectorUtils.collapse(detList, (a, b) => a + b) as number;
  }

  static permanent(alpha: RMat): number {
    if (VectorUtils.width(alpha) < 2) return (alpha[0] as RVec)[0] as number;
    const detList = new Vector<number>();
    for (let i = 0; i < VectorUtils.width(alpha); i++) {
      const temp = VectorUtils.columnRemoved(VectorUtils.rowRemoved(alpha, 0), i);
      detList.push(((alpha[0] as RVec)[i] as number) * RealMath.permanent(temp));
    }
    return VectorUtils.collapse(detList, (a, b) => a + b) as number;
  }

  /**
   * Matrix inverse by Gauss-Jordan elimination with partial pivoting
   * (bug fix: the AS3 version had no pivoting and divided by a zero pivot).
   */
  static invertMatrix(alpha: RMat, checkDeterminant = true): RMat {
    const n = VectorUtils.height(alpha);
    const w = VectorUtils.width(alpha);
    if (checkDeterminant && RealMath.determinant(alpha) === 0) {
      return VectorUtils.constantMatrix(n, w, 0);
    }

    const mat: number[][] = [...alpha].map((row) => [...(row as RVec)]);
    const inv: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    );

    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(mat[r][col]) > Math.abs(mat[pivot][col])) pivot = r;
      }
      if (pivot !== col) {
        [mat[col], mat[pivot]] = [mat[pivot], mat[col]];
        [inv[col], inv[pivot]] = [inv[pivot], inv[col]];
      }
      const p = mat[col][col];
      if (p === 0) continue; // singular; determinant check should have caught it
      for (let k = 0; k < n; k++) {
        mat[col][k] /= p;
        inv[col][k] /= p;
      }
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const f = mat[r][col];
        for (let k = 0; k < n; k++) {
          mat[r][k] -= f * mat[col][k];
          inv[r][k] -= f * inv[col][k];
        }
      }
    }
    return Vector.fromArray(inv.map((row) => Vector.fromArray(row)));
  }

  // -- Part II Chapter 3: statistics ---------------------------------------

  /** Numeric sort (bug fix: the AS3 default sort was lexicographic). */
  static sort(list: RVec, ascending = true): RVec {
    const sorted = list.clone().sort((a, b) => (a as number) - (b as number)) as RVec;
    return ascending ? sorted : sorted.reversed();
  }

  static minimum(list: RVec): number {
    return RealMath.sort(list, true)[0] as number;
  }

  static maximum(list: RVec): number {
    return RealMath.sort(list, false)[0] as number;
  }

  static percentile(list: RVec, n: number): number {
    const ordered = RealMath.sort(list);
    const theIndex = n * (ordered.length + 1);
    if (theIndex === Math.floor(theIndex)) {
      return ordered[theIndex - 1] as number;
    }
    return ((ordered[Math.floor(theIndex - 1)] as number) + (ordered[Math.ceil(theIndex - 1)] as number)) / 2;
  }

  static median(list: RVec): number {
    return RealMath.percentile(list, 0.5);
  }
  static q1(list: RVec): number {
    return RealMath.percentile(list, 0.25);
  }
  static q3(list: RVec): number {
    return RealMath.percentile(list, 0.75);
  }

  static fiveNumberSummary(list: RVec): RVec {
    return Vector.fromArray([
      RealMath.minimum(list),
      RealMath.q1(list),
      RealMath.median(list),
      RealMath.q3(list),
      RealMath.maximum(list),
    ]);
  }

  static sum(list: RVec): number {
    return VectorUtils.collapse(list, (a, b) => a + b, 0) as number;
  }

  static product(list: RVec): number {
    return VectorUtils.collapse(list, (a, b) => a * b, 1) as number;
  }

  static mean(list: RVec): number {
    return RealMath.sum(list) / list.length;
  }

  /** Sample variance (bug fix: AS3 divided by N despite the `n<2 -> NaN` guard). */
  static variance(list: RVec): number {
    if (list.length < 2) return NaN;
    const m = RealMath.mean(list);
    let s = 0;
    for (const x of list) s += Math.pow((x as number) - m, 2);
    return s / (list.length - 1);
  }

  static standardDeviation(list: RVec): number {
    return Math.sqrt(RealMath.variance(list));
  }

  static normalProbabilityList(list: RVec, negativeInfinityApproximation = -5, integrationInterval = 0.0001): RVec {
    const m = RealMath.mean(list);
    const sd = RealMath.standardDeviation(list);
    return VectorUtils.transform(list, (x) =>
      RealMath.normalProbability(x, m, sd, negativeInfinityApproximation, integrationInterval),
    );
  }

  static zScoreList(list: RVec): RVec {
    const m = RealMath.mean(list);
    const sd = RealMath.standardDeviation(list);
    return VectorUtils.transform(list, (x) => RealMath.zScore(x, m, sd));
  }

  static roundedList(list: RVec, precision: number): RVec {
    return VectorUtils.transform(list, (x) => RealMath.roundTo(x, precision));
  }

  static jitteredList(list: RVec, magnitude = 0.1): RVec {
    return VectorUtils.transform(list, (x) => RealMath.jitter(x, magnitude));
  }

  static isOutlier(list: RVec, value: number, distance = 1.5): boolean {
    const range = distance * RealMath.interQuartileRange(list);
    return value < RealMath.q1(list) - range || value > RealMath.q3(list) + range;
  }

  static interQuartileRange(list: RVec): number {
    return RealMath.q3(list) - RealMath.q1(list);
  }

  static outliers(list: RVec, distance = 1.5): RVec {
    return VectorUtils.filter(list, (x) => RealMath.isOutlier(list, x, distance));
  }

  static outliersRemoved(list: RVec, distance = 1.5): RVec {
    return VectorUtils.filter(list, (x) => !RealMath.isOutlier(list, x, distance));
  }

  // -- Part II Chapter 5: bivariate ----------------------------------------

  static correlation(x: RVec, y: RVec): number {
    if (x.length < 2) return NaN;
    const xMean = RealMath.mean(x);
    const yMean = RealMath.mean(y);
    const xSD = RealMath.standardDeviation(x);
    const ySD = RealMath.standardDeviation(y);
    let s = 0;
    for (let i = 0; i < x.length; i++) {
      s += (((x[i] as number) - xMean) / xSD) * (((y[i] as number) - yMean) / ySD);
    }
    return s / (x.length - 1);
  }

  static linRegSlope(x: RVec, y: RVec): number {
    return (RealMath.correlation(x, y) * RealMath.standardDeviation(y)) / RealMath.standardDeviation(x);
  }

  static linRegIntercept(x: RVec, y: RVec): number {
    return RealMath.mean(y) - RealMath.linRegSlope(x, y) * RealMath.mean(x);
  }

  static linearRegression(x: RVec, y: RVec): RVec {
    return Vector.fromArray([RealMath.linRegSlope(x, y), RealMath.linRegIntercept(x, y)]);
  }

  static linearRegressionFunction(x: RVec, y: RVec): Unary {
    const slope = RealMath.linRegSlope(x, y);
    const intercept = RealMath.linRegIntercept(x, y);
    return (a: number) => slope * a + intercept;
  }

  // -- Part IV: generic polymorphic dispatch -------------------------------

  static addGeneric(x: unknown = 0, y: unknown = 0): unknown {
    const tx = Type.getType(x);
    const ty = Type.getType(y);
    if (tx === Type.NUMBER && ty === Type.NUMBER) return RealMath.add(x as number, y as number);
    if (tx === Type.MATRIX && ty === Type.MATRIX) return RealMath.addMatrix(x as RMat, y as RMat);
    if (tx === Type.VECTOR && ty === Type.VECTOR) return RealMath.addVector(x as RVec, y as RVec);
    return null;
  }

  static subtractGeneric(x: unknown = 0, y: unknown = 0): unknown {
    const tx = Type.getType(x);
    const ty = Type.getType(y);
    if (tx === Type.NUMBER && ty === Type.NUMBER) return RealMath.subtract(x as number, y as number);
    if (tx === Type.MATRIX && ty === Type.MATRIX) return RealMath.subtractMatrix(x as RMat, y as RMat);
    if (tx === Type.VECTOR && ty === Type.VECTOR) return RealMath.subtractVector(x as RVec, y as RVec);
    return null;
  }

  static multiplyGeneric(x: unknown = 0, y: unknown = 0): unknown {
    const tx = Type.getType(x);
    const ty = Type.getType(y);
    if (tx === Type.NUMBER && ty === Type.NUMBER) return RealMath.multiply(x as number, y as number);
    if (tx === Type.NUMBER && ty === Type.MATRIX) return RealMath.scaleMatrix(y as RMat, x as number);
    if (tx === Type.MATRIX && ty === Type.NUMBER) return RealMath.scaleMatrix(x as RMat, y as number);
    if (tx === Type.NUMBER && ty === Type.VECTOR) return RealMath.scaleVector(y as RVec, x as number);
    if (tx === Type.VECTOR && ty === Type.NUMBER) return RealMath.scaleVector(x as RVec, y as number);
    if (tx === Type.MATRIX && ty === Type.MATRIX) return RealMath.multiplyMatrix(x as RMat, y as RMat);
    return null;
  }
}
