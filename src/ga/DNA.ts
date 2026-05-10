import { Vector2D } from './Vector2D';

/**
 * DNA (Kromozom) Sınıfı
 * 
 * Her DNA, bir aracın ömrü boyunca uygulayacağı hareket vektörlerinin (genlerin) dizisidir.
 * Genetik Algoritma terminolojisi:
 *   - Gen: Tek bir zaman adımındaki yönlendirme kuvveti
 *   - Kromozom: Tüm genlerin sıralı dizisi (rota planı)
 */
export class DNA {
  public readonly genes: Vector2D[];

  constructor(genes?: Vector2D[]) {
    if (genes) {
      this.genes = genes;
    } else {
      this.genes = [];
    }
  }

  /** Rastgele genlerle yeni bir DNA oluşturur */
  static createRandom(lifespan: number, maxForce: number): DNA {
    const genes: Vector2D[] = [];
    for (let i = 0; i < lifespan; i++) {
      genes.push(Vector2D.random(maxForce));
    }
    return new DNA(genes);
  }

  /**
   * Çaprazlama (Crossover)
   * İki ebeveynin DNA'sını tek-nokta çaprazlama ile birleştirir.
   * Nokta rastgele seçilir: sol taraf bu DNA'dan, sağ taraf partner'dan alınır.
   */
  crossover(partner: DNA): DNA {
    const newGenes: Vector2D[] = [];
    const midpoint = Math.floor(Math.random() * this.genes.length);
    
    for (let i = 0; i < this.genes.length; i++) {
      if (i < midpoint) {
        newGenes.push(this.genes[i]);
      } else {
        newGenes.push(partner.genes[i]);
      }
    }

    return new DNA(newGenes);
  }

  /**
   * Mutasyon (Mutation)
   * Her gen, verilen oran (0-1 arası) olasılıkla rastgele bir vektörle değiştirilir.
   * Mutasyon, popülasyonun yerel optimumlardan kurtulmasını sağlar.
   */
  mutate(mutationRate: number, maxForce: number): DNA {
    const newGenes = this.genes.map(gene => {
      if (Math.random() < mutationRate) {
        return Vector2D.random(maxForce);
      }
      return gene;
    });
    return new DNA(newGenes);
  }
}
