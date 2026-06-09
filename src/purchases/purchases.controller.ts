import { Controller, Post, Body, Headers } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import type { Event } from 'src/events/entities/event.entity';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  purchase(
    @Body('productId') productId: number,
    @Headers('user-id') userId: string,
  ): Event {
    return this.purchasesService.purchase(+userId, +productId);
  }
}
