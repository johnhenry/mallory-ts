/**
 * StringVarMath — symbolic arithmetic over string expressions. Rather than
 * evaluating, it builds up textual formulae while applying trivial algebraic
 * simplifications (adding/multiplying by the identities, negation, etc.).
 * Ported faithfully from Mallory's ActionScript `StringVarMath`.
 */
export class StringVarMath {
  static readonly Zero = "0";
  static readonly One = "1";

  /** Negate an expression, cancelling a leading unary minus. */
  static negative(element: string): string {
    if (element.charAt(0) === "-") return element.substr(1);
    return "-" + element;
  }

  /** Add two expressions, dropping additive-identity (`0`) terms. */
  static add(a: string, b: string): string {
    if (a === StringVarMath.Zero) return b;
    if (b === StringVarMath.Zero) return a;
    return `${a} + ${b}`;
  }

  /**
   * Multiply two expressions, applying `0`, `1`, `-1` and square simplifications.
   */
  static multiply(a: string, b: string): string {
    if (a === StringVarMath.Zero || b === StringVarMath.Zero) return StringVarMath.Zero;
    if (a === StringVarMath.One) return b;
    if (b === StringVarMath.One) return a;
    if (a === StringVarMath.negative(StringVarMath.One)) return StringVarMath.negative(b);
    if (b === StringVarMath.negative(StringVarMath.One)) return StringVarMath.negative(a);
    if (a === b) return `(${a}^2)`;
    return `(${a} * ${b})`;
  }

  /** The character for a given char code. */
  static fromCode(code: number): string {
    return String.fromCharCode(code);
  }
}
