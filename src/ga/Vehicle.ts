import { Vector2D } from './Vector2D';
import { DNA } from './DNA';
import { Obstacle } from './Obstacle';

/**
 * Vehicle (Otonom Deniz Aracı) Sınıfı
 * 
 * Her araç bağımsız bir ajandır. DNA'sındaki genler sırasıyla uygulanarak
 * hareket eder. Sonar sensörleri engelleri algılar.
 */
export class Vehicle {
  public position: Vector2D;
  public velocity: Vector2D;
  public acceleration: Vector2D;
  public dna: DNA;
  public fitness: number = 0;
  public crashed: boolean = false;
  public reachedTarget: boolean = false;
  public step: number = 0;
  public reachStep: number = Infinity;
  public trail: Vector2D[] = [];

  // Sonar verileri (en yakın engellere olan mesafe)
  public sonarReadings: number[] = [];

  private readonly maxSpeed: number = 4;
  private readonly startPosition: Vector2D;

  constructor(
    startPosition: Vector2D,
    dna: DNA
  ) {
    this.startPosition = startPosition;
    this.position = new Vector2D(startPosition.x, startPosition.y);
    this.velocity = new Vector2D(0, -1);
    this.acceleration = new Vector2D(0, 0);
    this.dna = dna;
  }

  /**
   * DNA'daki mevcut geni uygulayarak aracı bir adım ileri taşır.
   * Fizik simülasyonu: kuvvet → ivme → hız → konum
   */
  update(
    target: Vector2D,
    obstacles: Obstacle[],
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (this.crashed || this.reachedTarget) return;

    // Hedefe ulaşma kontrolü
    const distToTarget = this.position.distanceTo(target);
    if (distToTarget < 15) {
      this.reachedTarget = true;
      this.reachStep = this.step;
      return;
    }

    // Engel çarpışma kontrolü
    for (const obstacle of obstacles) {
      if (obstacle.contains(this.position)) {
        if (obstacle.type === 'wall' || obstacle.type === 'tree') {
          // Elastik Çarpışma (Sekme)
          const normal = this.position.sub(obstacle.position).normalize();
          const dotProduct = this.velocity.dot(normal);
          
          if (dotProduct < 0) { // Sadece engele doğru hareket ediyorsa yansıt
            this.velocity = this.velocity.sub(normal.mult(2 * dotProduct));
            this.velocity = this.velocity.mult(0.8); // Enerji kaybı (sürtünme)
          }
          
          // Topu engelin dışına it (iç içe girmeyi önle)
          this.position = obstacle.position.add(normal.mult(obstacle.radius + 1));
        } else {
          // Su veya kum gibi engeller topu eler (veya yavaşlatır)
          this.crashed = true;
          return;
        }
      }
    }

    // Sınır kontrolü (Duvarlardan da seksin)
    if (this.position.x < 0) {
      this.position = new Vector2D(0, this.position.y);
      this.velocity = new Vector2D(Math.abs(this.velocity.x) * 0.8, this.velocity.y);
    } else if (this.position.x > canvasWidth) {
      this.position = new Vector2D(canvasWidth, this.position.y);
      this.velocity = new Vector2D(-Math.abs(this.velocity.x) * 0.8, this.velocity.y);
    }

    if (this.position.y < 0) {
      this.position = new Vector2D(this.position.x, 0);
      this.velocity = new Vector2D(this.velocity.x, Math.abs(this.velocity.y) * 0.8);
    } else if (this.position.y > canvasHeight) {
      this.position = new Vector2D(this.position.x, canvasHeight);
      this.velocity = new Vector2D(this.velocity.x, -Math.abs(this.velocity.y) * 0.8);
    }

    // Sonar okumalarını güncelle
    this.updateSonar(obstacles);

    // DNA'dan hareket geni uygula
    if (this.step < this.dna.genes.length) {
      this.applyForce(this.dna.genes[this.step]);
    }

    // Fizik güncelleme
    this.velocity = this.velocity.add(this.acceleration).limit(this.maxSpeed);
    this.position = this.position.add(this.velocity);
    this.acceleration = new Vector2D(0, 0);

    // İz kaydet (her 3 adımda bir — performans için)
    if (this.step % 3 === 0) {
      this.trail.push(new Vector2D(this.position.x, this.position.y));
    }

    this.step++;
  }

  /** Aracın 8 yönlü sonar sensörlerini günceller */
  private updateSonar(obstacles: Obstacle[]): void {
    const sonarRange = 80;
    const directions = 8;
    this.sonarReadings = [];

    for (let i = 0; i < directions; i++) {
      const angle = (i / directions) * Math.PI * 2;
      const dir = Vector2D.fromAngle(angle + this.velocity.angle(), 1);

      let minDist = sonarRange;
      for (const obstacle of obstacles) {
        // Sonar ışını boyunca engel kontrolü
        for (let d = 5; d < sonarRange; d += 5) {
          const checkPoint = this.position.add(dir.mult(d));
          if (obstacle.contains(checkPoint)) {
            minDist = Math.min(minDist, d);
            break;
          }
        }
      }

      this.sonarReadings.push(minDist / sonarRange); // Normalize 0-1
    }
  }

  /** Kuvvet uygula (Newton F=ma) */
  private applyForce(force: Vector2D): void {
    this.acceleration = this.acceleration.add(force);
  }

  /**
   * Uygunluk Fonksiyonu (Fitness)
   * Fitness = (1/d) - penalty
   * 
   * - Hedefe yakın araçlar yüksek puan alır
   * - Engele çarpan araçlar ciddi ceza alır
   * - Hedefe ulaşan araçlar bonus alır (hız bonusu dahil)
   */
  calculateFitness(target: Vector2D, lifespan: number): void {
    const dist = this.position.distanceTo(target);

    if (this.reachedTarget) {
      // Hedefe ulaştı — hızlı ulaşan daha yüksek puan alır
      this.fitness = 1.0 + (1.0 - this.reachStep / lifespan) * 2.0;
      this.fitness = Math.pow(this.fitness, 4); // Başarıyı abartarak seçilimi güçlendir
    } else if (this.crashed) {
      // Çarptı — ağır ceza
      this.fitness = 0.1 / (dist + 1);
      this.fitness *= 0.1; // %90 ceza
    } else {
      // Yaşadı ama hedefe ulaşamadı
      this.fitness = 1.0 / (dist + 1);
      this.fitness = Math.pow(this.fitness, 2); // Yakınlığı ödüllendir
    }
  }

  /** Yeni bir jenerasyon için aracı sıfırla */
  reset(newDna: DNA): void {
    this.position = new Vector2D(this.startPosition.x, this.startPosition.y);
    this.velocity = new Vector2D(0, -1);
    this.acceleration = new Vector2D(0, 0);
    this.dna = newDna;
    this.fitness = 0;
    this.crashed = false;
    this.reachedTarget = false;
    this.step = 0;
    this.reachStep = Infinity;
    this.trail = [];
    this.sonarReadings = [];
  }
}
