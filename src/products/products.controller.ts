import { Controller, Get, Param, ParseIntPipe, Headers } from '@nestjs/common';
import { ProductsService } from './products.service';
import type { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Product[] {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('user-id') userId: string,
  ): Product | null {
    return this.productsService.findOne(id, +userId);
  }

  @Get(':id/recommendations')
  relatedProducts(@Param('id', ParseIntPipe) id: number): Product[] {
    return this.productsService.relatedProducts(id);
  }
}
