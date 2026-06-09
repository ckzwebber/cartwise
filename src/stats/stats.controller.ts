import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('products')
  productViews(): Record<number, number> {
    return this.statsService.productViews();
  }

  @Get('categories')
  categoryViews(): Record<string, number> {
    return this.statsService.categoryViews();
  }

  @Get('add-to-list')
  addToListCount(): Record<number, number> {
    return this.statsService.addToListCount();
  }
}
