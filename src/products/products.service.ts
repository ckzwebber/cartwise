import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { products } from './data/products.data';
import { EventsService } from 'src/events/events.service';
import { events } from 'src/events/data/events.data';

@Injectable()
export class ProductsService {
  constructor(private readonly eventsServices: EventsService) {}

  findAll(): Product[] {
    return products;
  }

  findOne(id: number, userId: number): Product | null {
    const product = products.find((p) => p.id === id) ?? null;

    if (!product) return null;

    this.eventsServices.create(userId, product.id, 'PRODUCT_VIEW');

    return product;
  }

  relatedProducts(productId: number): Product[] {
    const userBaskets = new Map<number, Set<number>>();

    events
      .filter((e) => e.type === 'ADD_TO_LIST')
      .forEach((e) => {
        if (!userBaskets.has(e.userId)) userBaskets.set(e.userId, new Set());
        userBaskets.get(e.userId)!.add(e.productId);
      });

    const scores = new Map<number, number>();

    userBaskets.forEach((basket) => {
      if (!basket.has(productId)) return;
      basket.forEach((otherId) => {
        if (otherId !== productId)
          scores.set(otherId, (scores.get(otherId) ?? 0) + 1);
      });
    });

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }
}
