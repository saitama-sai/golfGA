import { Vector2D } from './Vector2D';

/**
 * Engel (Obstacle) sınıfı
 * Deniz ortamındaki kayalıkları, şamandıraları ve diğer engelleri temsil eder.
 */
export interface ObstacleConfig {
  position: Vector2D;
  radius: number;
  type: 'bunker' | 'water' | 'tree' | 'wall' | 'custom';
}

export class Obstacle {
  public readonly position: Vector2D;
  public readonly radius: number;
  public readonly type: ObstacleConfig['type'];

  constructor(config: ObstacleConfig) {
    this.position = config.position;
    this.radius = config.radius;
    this.type = config.type;
  }

  /** Verilen pozisyonun engelin alanı içinde olup olmadığını kontrol eder */
  contains(point: Vector2D): boolean {
    return point.distanceTo(this.position) < this.radius;
  }

  /** Engelin etki alanı içinde olup olmadığını kontrol eder (güvenlik mesafesi dahil) */
  isInDangerZone(point: Vector2D, safetyMargin: number = 5): boolean {
    return point.distanceTo(this.position) < this.radius + safetyMargin;
  }

  /** Engel ile verilen nokta arasındaki en yakın mesafeyi döndürür */
  distanceToSurface(point: Vector2D): number {
    return Math.max(0, point.distanceTo(this.position) - this.radius);
  }
}
