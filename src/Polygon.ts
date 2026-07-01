import { Vector } from "./Vector.ts";
import { IntegerMath } from "./IntegerMath.ts";
import { RealMath } from "./RealMath.ts";

/** A 2D point stored as a {@link Vector} `[x, y]`. */
type Point = Vector<number>;

/**
 * Polygon — an ordered list of vertex points ({@link Vector} subclass). Ported
 * from Mallory's ActionScript `Polygon`.
 *
 * Bug fixes from the AS3 original:
 *  - `perimeter` accumulated into a `uint`, truncating the fractional length.
 *  - `area` only summed two triangles, so it was wrong for pentagons and up; it
 *    now uses the shoelace formula, correct for any simple polygon.
 *  - `angle` was stubbed to `return 0` (with dead code calling classes that do
 *    not exist); it now computes the interior angle via the law of cosines it
 *    documented.
 */
export class Polygon extends Vector<Point> {
  /** The vertex at `index`, wrapping around the polygon. */
  vertex(index: number): Point {
    return this[IntegerMath.modulus(index, this.length)] as Point;
  }

  get vertexCount(): number {
    return this.length;
  }

  get edgeCount(): number {
    if (this.vertexCount < 3) return this.length - 1;
    return this.vertexCount;
  }

  /** The edge starting at `index` as a two-vertex polygon. */
  edge(index: number): Polygon {
    return new Polygon(this.vertex(index), this.vertex(index + 1));
  }

  /** Total perimeter length (bug fix: no longer truncated to an integer). */
  perimeter(): number {
    let per = 0;
    for (let i = 0; i < this.edgeCount; i++) {
      per += RealMath.distanceVector(this.vertex(i), this.vertex(i + 1));
    }
    return per;
  }

  /** Heron's-formula area of the triangle on the first three vertices. */
  private triArea(): number {
    const a = RealMath.distanceVector(this.vertex(0), this.vertex(1));
    const b = RealMath.distanceVector(this.vertex(1), this.vertex(2));
    const c = RealMath.distanceVector(this.vertex(2), this.vertex(0));
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }

  /**
   * Area of the polygon via the shoelace formula (bug fix: the AS3 version only
   * summed two triangles and was wrong for polygons with more than four sides).
   */
  area(): number {
    if (this.vertexCount < 3) return 0;
    if (this.vertexCount === 3) return this.triArea();
    let sum = 0;
    for (let i = 0; i < this.vertexCount; i++) {
      const current = this.vertex(i);
      const next = this.vertex(i + 1);
      sum += (current.x as number) * (next.y as number) - (next.x as number) * (current.y as number);
    }
    return Math.abs(sum) / 2;
  }

  /**
   * Interior angle (radians) at vertex `i`, via the law of cosines
   * (bug fix: the AS3 method always returned 0).
   */
  angle(i: number): number {
    const ab = RealMath.distanceVector(this.vertex(i), this.vertex(i + 1));
    const bc = RealMath.distanceVector(this.vertex(i), this.vertex(i - 1));
    const ac = RealMath.distanceVector(this.vertex(i + 1), this.vertex(i - 1));
    return Math.acos((ab * ab + bc * bc - ac * ac) / (2 * ab * bc));
  }

  /** A clone of the polygon (deep-clones nested vertex vectors by default). */
  override clone(deep = true): Polygon {
    const out = new Polygon(this.length);
    for (let i = 0; i < out.length; i++) {
      const el = this[i];
      out[i] = deep && el instanceof Vector ? (el.clone() as Point) : (el as Point);
    }
    return out;
  }
}
