import { Vector2D } from './Vector2D';
import { DNA } from './DNA';
import { Vehicle } from './Vehicle';
import { Obstacle } from './Obstacle';

/**
 * Popülasyon (Filo) Sınıfı
 * 
 * Genetik Algoritmanın ana döngüsünü yönetir:
 *   1. Değerlendirme (Evaluate) → Fitness hesapla
 *   2. Seçilim (Selection) → Uygunluk havuzu oluştur
 *   3. Üreme (Reproduction) → Çaprazlama + Mutasyon
 */
export interface PopulationStats {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  reachedTarget: number;
  crashed: number;
  alive: number;
  totalVehicles: number;
  bestDna: DNA | null;
}

export class Population {
  public vehicles: Vehicle[];
  public generation: number = 1;
  public bestFitnessEver: number = 0;
  public bestDnaEver: DNA | null = null;

  private readonly startPosition: Vector2D;
  private readonly lifespan: number;
  private readonly maxForce: number;
  private mutationRate: number;

  constructor(
    size: number,
    startPosition: Vector2D,
    lifespan: number,
    maxForce: number,
    mutationRate: number
  ) {
    this.startPosition = startPosition;
    this.lifespan = lifespan;
    this.maxForce = maxForce;
    this.mutationRate = mutationRate;

    // İlk nesil — rastgele DNA'lar
    this.vehicles = [];
    for (let i = 0; i < size; i++) {
      const dna = DNA.createRandom(lifespan, maxForce);
      this.vehicles.push(new Vehicle(startPosition, dna));
    }
  }

  /** Popülasyondaki tüm araçları bir adım güncelle */
  update(target: Vector2D, obstacles: Obstacle[], canvasWidth: number, canvasHeight: number): void {
    for (const vehicle of this.vehicles) {
      vehicle.update(target, obstacles, canvasWidth, canvasHeight);
    }
  }

  /** Tüm araçların ömrünün dolup dolmadığını kontrol et */
  isGenerationComplete(): boolean {
    return this.vehicles.every(v =>
      v.step >= this.lifespan || v.crashed || v.reachedTarget
    );
  }

  /**
   * Değerlendirme: Her aracın fitness'ını hesapla ve en iyiyi kaydet
   */
  evaluate(target: Vector2D): void {
    let bestFitness = 0;
    let bestDna: DNA | null = null;

    for (const vehicle of this.vehicles) {
      vehicle.calculateFitness(target, this.lifespan);
      if (vehicle.fitness > bestFitness) {
        bestFitness = vehicle.fitness;
        bestDna = vehicle.dna;
      }
    }

    if (bestFitness > this.bestFitnessEver) {
      this.bestFitnessEver = bestFitness;
      this.bestDnaEver = bestDna;
    }
  }

  /**
   * Seçilim + Üreme: Yeni nesil oluştur
   * 
   * Uygunluk orantılı seçilim (Fitness Proportionate Selection):
   * Fitness'ı yüksek olan araçların ebeveyn olarak seçilme olasılığı daha yüksektir.
   */
  evolve(): void {
    // 1. Uygunluk havuzu oluştur (mating pool)
    const maxFitness = Math.max(...this.vehicles.map(v => v.fitness));
    const matingPool: Vehicle[] = [];

    for (const vehicle of this.vehicles) {
      // Normalize et ve havuza orantılı sayıda ekle
      const normalizedFitness = maxFitness > 0 ? vehicle.fitness / maxFitness : 0;
      const n = Math.floor(normalizedFitness * 100);
      for (let i = 0; i < n; i++) {
        matingPool.push(vehicle);
      }
    }

    // Havuz boşsa (tüm fitness 0), rastgele DNA üret
    if (matingPool.length === 0) {
      for (const vehicle of this.vehicles) {
        const newDna = DNA.createRandom(this.lifespan, this.maxForce);
        vehicle.reset(newDna);
      }
      this.generation++;
      return;
    }

    // 2. Yeni nesil oluştur
    const newVehicles: Vehicle[] = [];

    // ELİTİZM (Elitism): En iyi genlerin kaybolmasını önlemek için 
    // tüm zamanların en iyi DNA'sını (veya bu neslin en iyisini) mutasyonsuz olarak yeni nesle aktar.
    if (this.bestDnaEver) {
      // Şampiyon topu doğrudan kopyala
      newVehicles.push(new Vehicle(this.startPosition, this.bestDnaEver));
    }

    // Geri kalan araçları çaprazlama ve mutasyonla üret
    for (let i = newVehicles.length; i < this.vehicles.length; i++) {
      // Rastgele iki ebeveyn seç
      const parentA = matingPool[Math.floor(Math.random() * matingPool.length)];
      const parentB = matingPool[Math.floor(Math.random() * matingPool.length)];

      // Çaprazlama
      let childDna = parentA.dna.crossover(parentB.dna);

      // Mutasyon
      childDna = childDna.mutate(this.mutationRate, this.maxForce);

      // Yeni araç oluştur
      newVehicles.push(new Vehicle(this.startPosition, childDna));
    }

    this.vehicles = newVehicles;
    this.generation++;
  }

  /** Popülasyon istatistiklerini hesapla */
  getStats(): PopulationStats {
    let totalFitness = 0;
    let bestFitness = 0;
    let bestDna: DNA | null = null;
    let reachedTarget = 0;
    let crashed = 0;

    for (const vehicle of this.vehicles) {
      totalFitness += vehicle.fitness;
      if (vehicle.fitness > bestFitness) {
        bestFitness = vehicle.fitness;
        bestDna = vehicle.dna;
      }
      if (vehicle.reachedTarget) reachedTarget++;
      if (vehicle.crashed) crashed++;
    }

    return {
      generation: this.generation,
      bestFitness: Math.round(bestFitness * 1000) / 1000,
      avgFitness: Math.round((totalFitness / this.vehicles.length) * 1000) / 1000,
      reachedTarget,
      crashed,
      alive: this.vehicles.length - reachedTarget - crashed,
      totalVehicles: this.vehicles.length,
      bestDna,
    };
  }

  /** Mutasyon oranını güncelle */
  setMutationRate(rate: number): void {
    this.mutationRate = rate;
  }

  /** Popülasyonu tamamen sıfırla (yeni simülasyon) */
  reset(size: number): void {
    this.vehicles = [];
    for (let i = 0; i < size; i++) {
      const dna = DNA.createRandom(this.lifespan, this.maxForce);
      this.vehicles.push(new Vehicle(this.startPosition, dna));
    }
    this.generation = 1;
    this.bestFitnessEver = 0;
    this.bestDnaEver = null;
  }
}
