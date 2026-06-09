import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { ShoppingListService } from './shopping-list.service';
import type { ShoppingListItem } from './entities/shopping-list-item.entity';
import type { Product } from 'src/products/entities/product.entity';

@Controller('shopping-list')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Post('items')
  addItem(
    @Body('productId') productId: number,
    @Headers('user-id') userId: string,
  ): ShoppingListItem {
    return this.shoppingListService.addItem(+userId, +productId);
  }

  @Get('items')
  findAll(): ShoppingListItem[] {
    return this.shoppingListService.findAll();
  }

  @Get('suggestions')
  suggestions(@Headers('user-id') userId: string): Product[] {
    return this.shoppingListService.suggestions(+userId);
  }
}
