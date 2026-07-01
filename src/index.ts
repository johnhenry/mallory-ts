/**
 * mallory-ts — advanced college-level mathematics for TypeScript.
 *
 * A modern, tested TypeScript port of the Mallory ActionScript 3 library.
 */

// Foundations
export { Vector } from "./Vector.ts";
export { ComplexNumber } from "./ComplexNumber.ts";
export { Type, TypeTag } from "./Type.ts";

// Utilities & leaves
export { Utilities } from "./Utilities.ts";
export { Logic } from "./Logic.ts";
export { IntUtils } from "./IntUtils.ts";
export { StringVarMath } from "./StringVarMath.ts";
export { SpecialOperator } from "./SpecialOperator.ts";
export { Calculus, NotImplementedError } from "./Calculus.ts";

// Linear algebra
export { VectorUtils, type Matrix } from "./VectorUtils.ts";

// Numeric cores
export { RealMath } from "./RealMath.ts";
export { ComplexMath } from "./ComplexMath.ts";

// Combinatorics & number theory
export { IntegerMath } from "./IntegerMath.ts";
export { Cycle } from "./Cycle.ts";
export { Permutation } from "./Permutation.ts";
export { Polynomial } from "./Polynomial.ts";

// Algebraic structures & geometry
export { Structure, type StructureOptions } from "./Structure.ts";
export { Polygon } from "./Polygon.ts";

// Expression evaluation
export { Environment } from "./Environment.ts";
export { Expression } from "./Expression.ts";
export { StringEvaluator } from "./StringEvaluator.ts";

// Graphing (renderer-agnostic geometry)
export {
  GraphUtils,
  type Placement2D,
  type BarPlacement2D,
  type StrokeStyle,
  type FillStyle,
  type PathCommand,
  type Path2D,
} from "./GraphUtils.ts";
export {
  Graph3DUtils,
  type Vec3,
  type Face,
  type Material,
  type Mesh,
  type Placement3D,
} from "./Graph3DUtils.ts";
