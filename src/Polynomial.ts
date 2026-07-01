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
