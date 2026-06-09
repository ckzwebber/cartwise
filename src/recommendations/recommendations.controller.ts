import { Controller, Get, Headers, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import type { Product } from 'src/products/entities/product.entity';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  recommend(@Headers('user-id') userId: string): Product[] {
    return this.recommendationsService.recommend(+userId);
  }

  @Get('trending')
  trending(@Query('limit') limit = '10'): Product[] {
    return this.recommendationsService.trending(+limit);
  }

  @Get('restock')
  restock(@Headers('user-id') userId: string): Product[] {
    return this.recommendationsService.restock(+userId);
  }
}
