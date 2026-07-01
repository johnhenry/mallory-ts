import { ComplexNumber } from "./ComplexNumber.ts";
import { Vector } from "./Vector.ts";

/**
 * IntegerMath — integer arithmetic and number theory (factors, primes,
 * totient, GCD/LCM, factorials, digit manipulation). Ported from Mallory's
 * ActionScript `IntegerMath`.
 *
 * Bug fixes from the AS3 original:
 *  - `modulus` recursed one subtraction at a time (stack overflow for large
 *    inputs; infinite at `beta === 0`) — now uses `%` with a positive result.
 *  - `gcd` broke on a zero operand — now iterative Euclid, `gcd(a, 0) === a`.
 *  - `primeFactors` infinitely looped for `0` and negative numbers
 *    (`sqrt(negative) === NaN`) — now factors the absolute value with guards.
 *  - `totient` had a `return`-less `if(Prime)` branch and returned 0 for 1.
 *  - the `*List` reducers mutated their input array — now operate on a copy.
 */

type IntList = ReadonlyArray<number> | Vector<number>;

export class IntegerMath {
  static readonly Zero = 0;
  static readonly One = 1;
  /** Largest 32-bit signed int, matching AS3 `int.MAX_VALUE`. */
  static readonly Infinity = 2147483647;

  // -- Section 1: comparison -----------------------------------------------

  static compare(alpha: number, beta: number): number {
    if (alpha < beta) return -1;
    if (alpha > beta) return 1;
    return 0;
  }
  static lessThan(alpha: number, beta: number): boolean {
    return IntegerMath.compare(alpha, beta) === -1;
  }
  static equal(alpha: number, beta: number): boolean {
    return IntegerMath.compare(alpha, beta) === 0;
  }
  static greaterThan(alpha: number, beta: number): boolean {
    return IntegerMath.compare(alpha, beta) === 1;
  }

  static amicable(alpha: number, beta: number): boolean {
    return (
      IntegerMath.equal(IntegerMath.addList(IntegerMath.properFactors(alpha)), beta) &&
      IntegerMath.equal(IntegerMath.addList(IntegerMath.properFactors(beta)), alpha)
    );
  }

  // -- Section 2: unary ----------------------------------------------------

  /** Coerce a complex/number/string value to an integer. */
  static wrap(alpha: unknown): number {
    if (alpha instanceof ComplexNumber) return Math.trunc(alpha.value);
    if (ComplexNumber.isComplex(alpha)) return Math.trunc(ComplexNumber.from(alpha).value);
    return Math.trunc(Number(alpha));
  }

  static negative(alpha: number): number {
    return -alpha;
  }
  static reciprocal(alpha: number): number {
    return alpha === 1 ? IntegerMath.One : IntegerMath.Zero;
  }
  static conjugate(alpha: number): number {
    return alpha;
  }
  static magnitude(alpha: number): number {
    return alpha;
  }
  static angle(_alpha: number): number {
    return IntegerMath.Zero;
  }
  static identity(alpha: number): number {
    return alpha;
  }

  // -- Section 3: binary ---------------------------------------------------

  static add(alpha: number, beta: number): number {
    return alpha + beta;
  }

  static addList(list: IntList): number {
    const work = [...list];
    if (work.length === 0) return IntegerMath.Zero;
    return work.reduce((a, b) => IntegerMath.add(a, b));
  }

  static addIteratively(...args: number[]): number {
    return args.reduce((sum, x) => sum + x, IntegerMath.Zero);
  }

  static multiply(alpha: number, beta: number): number {
    return alpha * beta;
  }

  static multiplyList(list: IntList): number {
    const work = [...list];
    if (work.length === 0) return IntegerMath.One;
    return work.reduce((a, b) => IntegerMath.multiply(a, b));
  }

  static multiplyIteratively(...args: number[]): number {
    return args.reduce((product, x) => product * x, IntegerMath.One);
  }

  static subtract(alpha: number, beta: number): number {
    return alpha - beta;
  }

  static divide(alpha: number, beta: number): number {
    return alpha / beta;
  }

  /** Non-negative remainder `alpha mod beta` (bug fix: no longer recurses). */
  static modulus(alpha: number, beta: number): number {
    if (beta === 0) return NaN;
    return ((alpha % beta) + beta) % beta;
  }

  static power(alpha: number, beta: number): number {
    return Math.pow(alpha, beta);
  }

  // -- Section 4: factors & primes -----------------------------------------

  static prime(number: number): boolean {
    const val = Math.abs(number);
    if (val === 1 || val === 0) return false;
    for (let i = 2; i <= Math.sqrt(val); i++) {
      if (val % i === 0) return false;
    }
    return true;
  }

  static composite(number: number): boolean {
    if (Math.abs(number) === 1) return false;
    return !IntegerMath.prime(number);
  }

  static perfect(number: number): boolean {
    return IntegerMath.abundance(number) === 0;
  }

  static smooth(number: number, B: number): boolean {
    return [...IntegerMath.primeFactors(number)].every((f) => f <= B);
  }

  static powerSmooth(number: number, B: number): boolean {
    return [...IntegerMath.primePowers(number)].every((f) => f <= B);
  }

  static abundance(number: number): number {
    return IntegerMath.addList(IntegerMath.properFactors(number)) - number;
  }

  static deficiency(number: number): number {
    return -IntegerMath.abundance(number);
  }

  static factors(number: number): Vector<number> {
    const num = Math.abs(number);
    const out = new Vector<number>();
    for (let i = 1; i <= num; i++) if (num % i === 0) out.push(i);
    return out;
  }

  static properFactors(number: number): Vector<number> {
    const factors = IntegerMath.factors(number);
    factors.pop();
    return factors;
  }

  static primeFactors(number: number): Vector<number> {
    let num = Math.abs(number);
    const out = new Vector<number>();
    if (num < 2) {
      if (num === 1) out.push(1);
      return out;
    }
    out.push(num);
    while (IntegerMath.composite(num)) {
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) {
          out.splice(out.length - 1, 1, i);
          num /= i;
          out.push(num);
          break;
        }
      }
    }
    return out;
  }

  static distinctPrimeFactors(number: number): Vector<number> {
    const out = new Vector<number>();
    for (const f of IntegerMath.primeFactors(number)) {
      if (out.lastIndexOf(f) === -1) out.push(f);
    }
    return out;
  }

  static primeExponents(number: number): Vector<number> {
    const members: number[] = [];
    const powers = new Vector<number>();
    for (const f of IntegerMath.primeFactors(number)) {
      if (!members.includes(f)) {
        members.push(f);
        powers.push(0);
      }
      powers[powers.length - 1] = (powers[powers.length - 1] as number) + 1;
    }
    return powers;
  }

  static primePowers(number: number): Vector<number> {
    const members: number[] = [];
    const multiplied = new Vector<number>();
    for (const f of IntegerMath.primeFactors(number)) {
      if (!members.includes(f)) {
        members.push(f);
        multiplied.push(f);
      } else {
        multiplied[multiplied.length - 1] = IntegerMath.multiply(multiplied[multiplied.length - 1] as number, f);
      }
    }
    return multiplied;
  }

  static primeFactorization(number: number): string {
    const members = [...IntegerMath.distinctPrimeFactors(number)];
    const powers = [...IntegerMath.primeExponents(number)];
    return members.map((m, i) => `${m}^${powers[i]}`).join(" * ");
  }

  static primesTo(number: number): Vector<number> {
    if (number < 2) return new Vector<number>();
    const primes = new Vector<number>();
    primes.push(2);
    for (let i = 3; i <= number; i++) if (i % 2 !== 0) primes.push(i);
    let j = 1;
    while (j < primes.length) {
      for (let i = j + 1; i < primes.length; i++) {
        if ((primes[i] as number) % (primes[j] as number) === 0) {
          primes.splice(i, 1);
          i--;
        }
      }
      j++;
    }
    return primes;
  }

  static totient(number: number): number {
    if (number === 1) return 1;
    let product = number;
    for (const p of IntegerMath.distinctPrimeFactors(number)) product *= 1 - 1 / p;
    return Math.round(product);
  }

  static radical(number: number): number {
    return IntegerMath.multiplyList(IntegerMath.distinctPrimeFactors(number));
  }

  /** Divisor function σ_n: sum of the n-th powers of the divisors. */
  static divisor(number: number, n: number): number {
    return IntegerMath.addList([...IntegerMath.factors(number)].map((d) => IntegerMath.power(d, n)));
  }

  /** Greatest common divisor (bug fix: iterative Euclid, handles zero). */
  static gcd(alpha: number, beta: number): number {
    let a = Math.abs(alpha);
    let b = Math.abs(beta);
    while (b !== 0) [a, b] = [b, a % b];
    return a;
  }

  static gcdList(list: IntList): number {
    const work = [...list];
    if (work.length === 0) return IntegerMath.One;
    return work.reduce((a, b) => IntegerMath.gcd(a, b));
  }

  static lcm(alpha: number, beta: number): number {
    if (alpha === 0 || beta === 0) return 0;
    return (alpha * beta) / IntegerMath.gcd(alpha, beta);
  }

  static lcmList(list: IntList): number {
    const work = [...list];
    if (work.length === 0) return IntegerMath.Infinity;
    return work.reduce((a, b) => IntegerMath.lcm(a, b));
  }

  static factorial(number: number, factor = 1): number {
    if (number <= 1) return 1;
    return IntegerMath.multiply(number, IntegerMath.factorial(number - factor, factor));
  }

  static primorial(number: number): number {
    return IntegerMath.multiplyList(IntegerMath.primesTo(number));
  }

  /** Number of permutations nPr. */
  static permutations(n: number, r: number): number {
    return IntegerMath.factorial(n) / IntegerMath.factorial(n - r);
  }

  /** Number of combinations nCr. */
  static combinations(n: number, r: number): number {
    return IntegerMath.factorial(n) / (IntegerMath.factorial(r) * IntegerMath.factorial(n - r));
  }

  // -- Section 5: digit manipulation ---------------------------------------

  /** Digits of `number`, least-significant first. */
  static toArray(number: number): number[] {
    const s = String(Math.abs(number));
    const out: number[] = [];
    for (let i = 0; i < s.length; i++) out.push(Number.parseInt(s.charAt(s.length - 1 - i), 10));
    return out;
  }

  static fromArray(inArray: number[]): number {
    return Number.parseInt([...inArray].reverse().join(""), 10);
  }

  static place(number: number, index: number): number {
    return IntegerMath.toArray(number)[index] ?? 0;
  }

  static round(number: number, place: number): number {
    if (IntegerMath.equal(place, IntegerMath.Zero)) return number;
    const digits = IntegerMath.toArray(number);
    const decider = digits[place - 1] ?? 0;
    for (let i = 0; i < place; i++) digits[i] = 0;
    let result = IntegerMath.fromArray(digits);
    if (decider > 4) result = IntegerMath.add(result, IntegerMath.power(10, place));
    return result;
  }

  // -- Section 6: randomness -----------------------------------------------

  static random(r1 = 10, r2 = 0, _inclusive = true): number {
    const low = Math.min(r1, r2);
    const high = Math.max(r1, r2);
    return Math.round(low + Math.random() * (high - low));
  }

  static randomOrg(lower = 0, upper = 10, inclusive = true, fallback = true): number {
    if (fallback) return IntegerMath.random(lower, upper, inclusive);
    return 0;
  }
}
