import { Injectable } from '@nestjs/common';
import { events } from 'src/events/data/events.data';
import { products } from 'src/products/data/products.data';
import type { Product } from 'src/products/entities/product.entity';

const RESTOCK_DAYS: Record<string, number> = {
  Laticínios: 7,
  Hortifruti: 7,
  Carnes: 7,
  Padaria: 7,
  Bebidas: 14,
  Congelados: 14,
  Limpeza: 30,
  Higiene: 30,
  Mercearia: 30,
};

@Injectable()
export class RecommendationsService {
  recommend(userId: number): Product[] {
    const userEvents = events.filter(
      (e) =>
        e.userId === userId &&
        (e.type === 'PRODUCT_VIEW' || e.type === 'ADD_TO_LIST'),
    );

    if (userEvents.length === 0) return [];

    const weights: Record<string, number> = { PRODUCT_VIEW: 1, ADD_TO_LIST: 3 };
    const productMap = new Map(products.map((p) => [p.id, p.category]));

    const categoryScores = userEvents.reduce<Record<string, number>>((acc, e) => {
      const category = productMap.get(e.productId);
      if (category) acc[category] = (acc[category] ?? 0) + (weights[e.type] ?? 1);
      return acc;
    }, {});

    const topCategory = Object.entries(categoryScores).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    const interactedIds = new Set(userEvents.map((e) => e.productId));

    return products.filter(
      (p) => p.category === topCategory && !interactedIds.has(p.id),
    );
  }

  trending(limit = 10): Product[] {
    const recentAdditions = events
      .filter((e) => e.type === 'ADD_TO_LIST')
      .slice(-50);

    const counts = recentAdditions.reduce<Record<number, number>>((acc, e) => {
      acc[e.productId] = (acc[e.productId] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => products.find((p) => p.id === +id))
      .filter((p): p is Product => p !== undefined);
  }

  restock(userId: number): Product[] {
    const purchases = events.filter(
      (e) => e.userId === userId && e.type === 'PURCHASE',
    );

    if (purchases.length === 0) return [];

    const lastPurchased = new Map<number, Date>();
    purchases.forEach((e) => {
      const existing = lastPurchased.get(e.productId);
      if (!existing || e.createdAt > existing) lastPurchased.set(e.productId, e.createdAt);
    });

    const now = new Date();

    return [...lastPurchased.entries()]
      .filter(([productId, lastDate]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return false;
        const days = (now.getTime() - lastDate.getTime()) / 86_400_000;
        return days >= (RESTOCK_DAYS[product.category] ?? 14);
      })
      .map(([id]) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }
}
