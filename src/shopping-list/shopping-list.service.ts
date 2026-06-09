import { Injectable } from '@nestjs/common';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import { shoppingList } from './data/shopping-list.data';
import { EventsService } from 'src/events/events.service';
import { events } from 'src/events/data/events.data';
import { products } from 'src/products/data/products.data';
import type { Product } from 'src/products/entities/product.entity';

@Injectable()
export class ShoppingListService {
  constructor(private readonly eventsService: EventsService) {}

  addItem(userId: number, productId: number): ShoppingListItem {
    const newItem: ShoppingListItem = {
      id: shoppingList.length + 1,
      userId,
      productId,
      addedAt: new Date(),
    };

    shoppingList.push(newItem);
    this.eventsService.create(userId, productId, 'ADD_TO_LIST');

    return newItem;
  }

  findAll(): ShoppingListItem[] {
    return shoppingList;
  }

  suggestions(userId: number): Product[] {
    const userListIds = new Set(
      shoppingList.filter((i) => i.userId === userId).map((i) => i.productId),
    );

    if (userListIds.size === 0) return [];

    const userBaskets = new Map<number, Set<number>>();
    events
      .filter((e) => e.type === 'ADD_TO_LIST')
      .forEach((e) => {
        if (!userBaskets.has(e.userId)) userBaskets.set(e.userId, new Set());
        userBaskets.get(e.userId)!.add(e.productId);
      });

    const scores = new Map<number, number>();
    userBaskets.forEach((basket) => {
      userListIds.forEach((listProductId) => {
        if (!basket.has(listProductId)) return;
        basket.forEach((otherId) => {
          if (!userListIds.has(otherId))
            scores.set(otherId, (scores.get(otherId) ?? 0) + 1);
        });
      });
    });

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }
}
