import { Symbolic } from "./Symbolic.ts";

/**
 * Calculus — symbolic calculus entry points.
 *
 * In the ActionScript original every method here was an empty stub (the README
 * listed differentiation, integration and Taylor expansion under "Future
 * Plans"). Differentiation, integration and Taylor expansion are now implemented
 * on top of the {@link Symbolic} computer-algebra engine; equation solving
 * (`solveFor`) remains a documented gap and throws {@link NotImplementedError}.
 */
export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not implemented yet (planned; see project README).`);
    this.name = "NotImplementedError";
  }
}

export class Calculus {
  static readonly SolveTable: unknown = null;
  static readonly IntegralTable: unknown = null;
  static readonly DerivativeTable: unknown = null;
  static readonly TaylorExpansionTable: unknown = null;

  /** Solve `formula` for `variable`. Still unimplemented (equation solving). */
  static solveFor(_formula: string, _variable = "x"): string {
    throw new NotImplementedError("Calculus.solveFor");
  }

  /** The symbolic indefinite integral of `formula` with respect to `variable`. */
  static integralFunction(formula: string, variable = "x"): string {
    return Symbolic.toString(Symbolic.integrate(formula, variable));
  }

  /** The symbolic derivative of `formula` with respect to `variable`. */
  static derivativeFunction(formula: string, variable = "x"): string {
    return Symbolic.toString(Symbolic.differentiate(formula, variable));
  }

  /** The Taylor expansion of `formula` about `center`, up to `order`. */
  static taylorExpansion(formula: string, variable = "x", center = 0, order = 4): string {
    return Symbolic.toString(Symbolic.taylor(formula, variable, center, order));
  }
}
