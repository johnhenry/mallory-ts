/**
 * Calculus — symbolic calculus entry points.
 *
 * In the ActionScript original every method here was an empty stub (the README
 * lists equation solving, integration, differentiation and Taylor expansion
 * under "Future Plans"). Rather than silently returning `""`/`null` like the
 * AS3 code — which invites hard-to-trace bugs in callers — these throw an
 * explicit {@link NotImplementedError} so the unfinished status is obvious.
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

  /** Solve `formula` for `variable`. Not yet implemented. */
  static solveFor(_formula: string, _variable = "x"): string {
    throw new NotImplementedError("Calculus.solveFor");
  }

  /** Symbolic indefinite integral of `formula`. Not yet implemented. */
  static integralFunction(_formula: string): string {
    throw new NotImplementedError("Calculus.integralFunction");
  }

  /** Symbolic derivative of `formula`. Not yet implemented. */
  static derivativeFunction(_formula: string): string {
    throw new NotImplementedError("Calculus.derivativeFunction");
  }

  /** Taylor expansion of `formula`. Not yet implemented. */
  static taylorExpansion(_formula: string): string {
    throw new NotImplementedError("Calculus.taylorExpansion");
  }
}
