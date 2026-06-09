import { Injectable } from '@nestjs/common';
import { events } from 'src/events/data/events.data';
import { products } from 'src/products/data/products.data';

@Injectable()
export class StatsService {
  productViews(): Record<number, number> {
    return events
      .filter((e) => e.type === 'PRODUCT_VIEW')
      .reduce<Record<number, number>>((acc, e) => {
        acc[e.productId] = (acc[e.productId] ?? 0) + 1;
        return acc;
      }, {});
  }

  categoryViews(): Record<string, number> {
    const productMap = new Map(products.map((p) => [p.id, p.category]));

    return events
      .filter((e) => e.type === 'PRODUCT_VIEW')
      .reduce<Record<string, number>>((acc, e) => {
        const category = productMap.get(e.productId);
        if (category) {
          acc[category] = (acc[category] ?? 0) + 1;
        }
        return acc;
      }, {});
  }

  addToListCount(): Record<number, number> {
    return events
      .filter((e) => e.type === 'ADD_TO_LIST')
      .reduce<Record<number, number>>((acc, e) => {
        acc[e.productId] = (acc[e.productId] ?? 0) + 1;
        return acc;
      }, {});
  }
}
