import { Vector } from "./Vector.ts";

/**
 * Polynomial — coefficients indexed by power (`this[0]` is the constant term,
 * `this[i]` the coefficient of `xⁱ`). A {@link Vector} subclass, ported from
 * Mallory's ActionScript `Polynomial`.
 *
 * Bug fix: the AS3 `Multiply` iterated over `a.dimension.value` / `b.dimension.value`,
 * but neither `dimension` nor its `value` exists — every call threw. It now uses
 * the polynomial lengths (a discrete convolution of the coefficients).
 */
export class Polynomial extends Vector<number> {
  /** Degree of the polynomial (length − 1). */
  degree(): number {
    return this.length - 1;
  }

  /** The derivative polynomial. */
  derivative(): Polynomial {
    const der = new Polynomial();
    for (let i = 0; i < this.length; i++) der.push((this[i] as number) * i);
    der.splice(0, 1); // drop the (always-zero) constant term
    return der;
  }

  /**
   * An antiderivative with zero constant of integration.
   *
   * Bug fix: the AS3 loop ran `i < length`, dropping the highest-degree term, so
   * the "antiderivative" of a degree-d polynomial came out degree d−1. It now
   * runs through `length` inclusive, producing the correct degree d+1 result.
   */
  antiderivative(): Polynomial {
    const der = new Polynomial();
    der.push(0);
    for (let i = 1; i <= this.length; i++) der.push((this[i - 1] as number) / i);
    return der;
  }

  /** Evaluate the polynomial at `x` using Horner's method. */
  evaluate(x: number): number {
    let result = 0;
    for (let i = this.length - 1; i >= 0; i--) result = result * x + (this[i] as number);
    return result;
  }

  /** Add two polynomials (coefficient-wise, padding the shorter). */
  static add(a: Polynomial, b: Polynomial): Polynomial {
    const out = new Polynomial();
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) out[i] = (a[i] ?? 0) + (b[i] ?? 0);
    return out;
  }

  /** Subtract polynomial `b` from `a` (coefficient-wise). */
  static subtract(a: Polynomial, b: Polynomial): Polynomial {
    const out = new Polynomial();
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) out[i] = (a[i] ?? 0) - (b[i] ?? 0);
    return out;
  }

  /** Multiply two polynomials (coefficient convolution). */
  static multiply(a: Polynomial, b: Polynomial): Polynomial {
    const product = new Polynomial();
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        product[i + j] = (product[i + j] ?? 0) + (a[i] as number) * (b[j] as number);
      }
    }
    return product;
  }

  private static degreeOf(coeffs: number[]): number {
    for (let i = coeffs.length - 1; i >= 0; i--) if (coeffs[i] !== 0) return i;
    return -1; // the zero polynomial
  }

  private static fromCoeffs(coeffs: number[]): Polynomial {
    const p = new Polynomial();
    for (const c of coeffs) p.push(c);
    if (p.length === 0) p.push(0);
    return p;
  }

  /**
   * Polynomial long division: returns `{ quotient, remainder }` such that
   * `a = quotient·b + remainder` with `deg(remainder) < deg(b)`.
   */
  static divmod(a: Polynomial, b: Polynomial): { quotient: Polynomial; remainder: Polynomial } {
    const bCoeffs = [...b] as number[];
    const bDeg = Polynomial.degreeOf(bCoeffs);
    if (bDeg < 0) throw new Error("Polynomial division by the zero polynomial.");
    const bLead = bCoeffs[bDeg] as number;

    const r = [...a] as number[];
    const q: number[] = new Array(Math.max(r.length - bDeg, 1)).fill(0);
    let rDeg = Polynomial.degreeOf(r);
    while (rDeg >= bDeg) {
      const shift = rDeg - bDeg;
      const factor = (r[rDeg] as number) / bLead;
      q[shift] = factor;
      for (let i = 0; i <= bDeg; i++) r[i + shift] = (r[i + shift] as number) - factor * (bCoeffs[i] as number);
      r[rDeg] = 0; // guard against floating residue at the pivot
      rDeg = Polynomial.degreeOf(r);
    }

    const remDeg = Polynomial.degreeOf(r);
    return {
      quotient: Polynomial.fromCoeffs(q),
      remainder: Polynomial.fromCoeffs(remDeg < 0 ? [0] : r.slice(0, remDeg + 1)),
    };
  }

  /** The quotient of `a / b` (polynomial long division). */
  static divide(a: Polynomial, b: Polynomial): Polynomial {
    return Polynomial.divmod(a, b).quotient;
  }

  /** The remainder of `a / b` (polynomial long division). */
  static mod(a: Polynomial, b: Polynomial): Polynomial {
    return Polynomial.divmod(a, b).remainder;
  }

  /** Parse a polynomial string such as `"3*x^2-2*x+1"` (inverse of {@link toPolyString}). */
  static parse(str: string, variable = "x"): Polynomial {
    const s = str.replace(/\s+/g, "");
    const p = new Polynomial();
    if (s === "") {
      p.push(0);
      return p;
    }
    const terms = s
      .replace(/-/g, "+-")
      .split("+")
      .filter((t) => t !== "");
    for (const term of terms) {
      let coef: number;
      let exp: number;
      const vi = term.indexOf(variable);
      if (vi === -1) {
        coef = Number(term);
        exp = 0;
      } else {
        const coefPart = term.slice(0, vi).replace(/\*$/, "");
        coef = coefPart === "" || coefPart === "+" ? 1 : coefPart === "-" ? -1 : Number(coefPart);
        const rest = term.slice(vi + variable.length);
        exp = rest.startsWith("^") ? Number(rest.slice(1)) : 1;
      }
      p[exp] = (p[exp] ?? 0) + coef;
    }
    for (let i = 0; i < p.length; i++) if (p[i] === undefined) p[i] = 0;
    return p;
  }

  /** Human-readable form such as `3*x^2+2*x+1`. */
  toPolyString(variable = "x", descending = true): string {
    const term = (coef: number, i: number): string => {
      if (i === 0) return String(coef);
      if (i === 1) return `${coef}*${variable}`;
      return `${coef}*${variable}^${i}`;
    };
    const indices = descending
      ? Array.from({ length: this.length }, (_, i) => this.length - 1 - i)
      : Array.from({ length: this.length }, (_, i) => i);
    return indices.map((i) => term(this[i] as number, i)).join("+");
  }
}
