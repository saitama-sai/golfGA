/**
 * 2D Vektör sınıfı — Araçların hareket vektörlerini ve fizik hesaplamalarını yönetir.
 * Immutable tasarım: her işlem yeni bir vektör döndürür.
 */
export class Vector2D {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {}

  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  dot(v: Vector2D): number {
    return this.x * v.x + this.y * v.y;
  }

  mult(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vector2D {
    if (scalar === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return this.div(mag);
  }

  limit(max: number): Vector2D {
    if (this.magnitude() > max) {
      return this.normalize().mult(max);
    }
    return this;
  }

  distanceTo(v: Vector2D): number {
    return this.sub(v).magnitude();
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  static fromAngle(angle: number, magnitude: number = 1): Vector2D {
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  static random(maxMagnitude: number): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    const mag = Math.random() * maxMagnitude;
    return Vector2D.fromAngle(angle, mag);
  }
}
