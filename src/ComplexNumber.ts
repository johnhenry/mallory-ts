import { Vector } from "./Vector.ts";

/**
 * ComplexNumber — an immutable-ish complex value `value + iValue·i`.
 *
 * Ported from Mallory's ActionScript `ComplexNumber`. The AS3 class extended
 * `Array` and stashed its two coordinates in a private `Vector`; that indirection
 * bought nothing, so here the real and imaginary parts are plain number fields.
 * The historical accessor names `value` (real) and `iValue` (imaginary) are kept
 * because the rest of the library reads them hundreds of times; `re`/`im` are
 * provided as modern aliases.
 *
 * Bug fixes relative to the AS3 original:
 *  - `parse` (was `fromString`) no longer throws when `String.match` returns
 *    `null`, and it correctly handles negative imaginary parts and the bare
 *    `i` / `-i` forms, so it round-trips with `toString`.
 *  - `toString` renders a negative imaginary part as `a-b*i` rather than the
 *    old `a+-b*i`.
 */
export class ComplexNumber {
  value: number;
  iValue: number;

  /** "Not a Complex Number" — both parts NaN. */
  static readonly NaCN = new ComplexNumber(NaN, NaN);

  // The eight directed infinities of the complex plane.
  static readonly PositiveInfinity = new ComplexNumber(Infinity, 0);
  static readonly InfinityQ1 = new ComplexNumber(Infinity, Infinity);
  static readonly PositiveInfinityI = new ComplexNumber(0, Infinity);
  static readonly InfinityQ2 = new ComplexNumber(-Infinity, Infinity);
  static readonly NegativeInfinity = new ComplexNumber(-Infinity, 0);
  static readonly InfinityQ3 = new ComplexNumber(-Infinity, -Infinity);
  static readonly NegativeInfinityI = new ComplexNumber(0, -Infinity);
  static readonly InfinityQ4 = new ComplexNumber(Infinity, -Infinity);

  /**
   * Construct a complex number. Accepts:
   *  - `()` → 0
   *  - `(re, im)` → re + im·i
   *  - `(ComplexNumber)` → a copy
   *  - `(number)` → a real number
   *  - `(string)` → parsed (see {@link ComplexNumber.parse})
   */
  constructor(value: number | ComplexNumber | string = 0, iValue = 0) {
    if (value instanceof ComplexNumber) {
      this.value = value.value;
      this.iValue = value.iValue;
    } else if (typeof value === "string") {
      const parsed = ComplexNumber.parse(value);
      this.value = parsed.value;
      this.iValue = parsed.iValue;
    } else {
      this.value = value;
      this.iValue = iValue;
    }
  }

  /** Modern alias for {@link value} (the real part). */
  get re(): number {
    return this.value;
  }
  set re(v: number) {
    this.value = v;
  }

  /** Modern alias for {@link iValue} (the imaginary part). */
  get im(): number {
    return this.iValue;
  }
  set im(v: number) {
    this.iValue = v;
  }

  /**
   * Coerce an arbitrary value into a ComplexNumber, returning {@link NaCN} for
   * anything that cannot be interpreted numerically. Safe replacement for the
   * AS3 pattern `new ComplexNumber(element)` used by {@link isComplex}.
   */
  static from(input: unknown): ComplexNumber {
    if (input instanceof ComplexNumber) return new ComplexNumber(input);
    if (typeof input === "number") return new ComplexNumber(input, 0);
    if (typeof input === "string") return ComplexNumber.parse(input);
    return new ComplexNumber(NaN, NaN);
  }

  /** True when `input` is NOT a finite/definite complex number. */
  static isNotComplex(input: unknown): boolean {
    const c = ComplexNumber.from(input);
    return Number.isNaN(c.value) || Number.isNaN(c.iValue);
  }

  /** True when `input` can be interpreted as a complex number. */
  static isComplex(input: unknown): boolean {
    const c = ComplexNumber.from(input);
    return !Number.isNaN(c.value) && !Number.isNaN(c.iValue);
  }

  /**
   * Wrap arguments into a ComplexNumber. Mirrors AS3 `Wrap`: one argument is
   * coerced, two are taken as (re, im). Returns {@link NaCN} for other arities
   * (the AS3 version returned `false`; a ComplexNumber is friendlier and typed).
   */
  static wrap(...args: Array<number | ComplexNumber | string>): ComplexNumber {
    if (args.length === 1) return ComplexNumber.from(args[0]);
    if (args.length === 2) return new ComplexNumber(Number(args[0]), Number(args[1]));
    return new ComplexNumber(NaN, NaN);
  }

  /** Build a real complex number from a plain number. */
  static fromNumber(num: number): ComplexNumber {
    return new ComplexNumber(num, 0);
  }

  /**
   * Parse a string such as `"3"`, `"-2*i"`, `"i"`, `"3+2*i"`, `"3-2i"`.
   * The `*` between coefficient and `i` is optional. Whitespace is ignored.
   * Returns {@link NaCN} when the string is not a recognisable complex literal.
   */
  static parse(expression: string): ComplexNumber {
    // Collapse only the `*` that multiplies `i` (e.g. `2*i` -> `2i`); a bare `*`
    // is multiplication and must NOT be swallowed, or `"4*2"` would parse as 42.
    const s = expression.replace(/\s+/g, "").replace(/\*i/g, "i");
    if (s.length === 0) return new ComplexNumber(NaN, NaN);

    if (!s.includes("i")) {
      const n = Number(s);
      return Number.isNaN(n) ? new ComplexNumber(NaN, NaN) : new ComplexNumber(n, 0);
    }

    if (!s.endsWith("i")) return new ComplexNumber(NaN, NaN);
    const body = s.slice(0, -1); // strip trailing 'i'

    // Locate the sign that separates the real and imaginary terms. A leading
    // sign (position 0) belongs to the real term; a sign preceded by 'e'/'E'
    // is part of an exponent, not a separator.
    let splitIdx = -1;
    for (let k = 1; k < body.length; k++) {
      const ch = body[k];
      const prev = body[k - 1];
      if ((ch === "+" || ch === "-") && prev !== "e" && prev !== "E") splitIdx = k;
    }

    let realStr: string;
    let imagStr: string;
    if (splitIdx === -1) {
      realStr = "";
      imagStr = body;
    } else {
      realStr = body.slice(0, splitIdx);
      imagStr = body.slice(splitIdx);
    }

    const real = realStr === "" ? 0 : Number(realStr);
    let imag: number;
    if (imagStr === "" || imagStr === "+") imag = 1;
    else if (imagStr === "-") imag = -1;
    else imag = Number(imagStr);

    if (Number.isNaN(real) || Number.isNaN(imag)) return new ComplexNumber(NaN, NaN);
    return new ComplexNumber(real, imag);
  }

  /** XML-ish serialisation kept for API compatibility. */
  toXML(): string {
    return `<complexNumber><value>${this.value}</value><iValue>${this.iValue}</iValue></complexNumber>`;
  }

  /** The two coordinates as a fresh {@link Vector}. */
  toVector(): Vector<number> {
    return Vector.fromArray([this.value, this.iValue]);
  }

  /**
   * String representation. In `fullMode` the raw `a+bi` form is emitted (used
   * for debugging); otherwise a canonical, sign-correct form is produced that
   * round-trips through {@link parse}.
   */
  toString(fullMode = false): string {
    if (fullMode) return `${this.value}+${this.iValue}i`;

    if (this.value === 0 && this.iValue === 0) return "0";
    if (this.iValue === 0) return String(this.value);

    const absImag = Math.abs(this.iValue);
    const imagPart = absImag === 1 ? "i" : `${absImag}*i`;

    if (this.value === 0) return this.iValue < 0 ? `-${imagPart}` : imagPart;
    return `${this.value}${this.iValue < 0 ? "-" : "+"}${imagPart}`;
  }

  /** Additive inverse `-z`. */
  neg(): ComplexNumber {
    return new ComplexNumber(-this.value, -this.iValue);
  }

  /** Multiplicative inverse `1/z` (returns {@link NaCN} for zero). */
  recip(): ComplexNumber {
    const { value: a, iValue: b } = this;
    if (a === 0 && b === 0) return new ComplexNumber(NaN, NaN);
    const denom = a * a + b * b;
    return new ComplexNumber(a / denom, -b / denom);
  }

  /** Complex conjugate `a - b·i`. */
  conj(): ComplexNumber {
    return new ComplexNumber(this.value, -this.iValue);
  }

  /** Swap the real and imaginary parts (`a + b·i` → `b + a·i`). */
  flip(): ComplexNumber {
    return new ComplexNumber(this.iValue, this.value);
  }

  /** Structural equality (NaN parts compare unequal, matching IEEE semantics). */
  equals(other: ComplexNumber): boolean {
    return this.value === other.value && this.iValue === other.iValue;
  }
}
