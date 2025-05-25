// backend/src/controllers/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductDto } from '../dtos/product.dto';
import { AppService } from 'src/servicecs/app.service';

interface ProductQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  productTypeId?: string;
}

@Controller('api/products')
export class ProductsController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async getProducts(@Query() query: ProductQueryParams) {
    console.log('Get Products with query:', query);

    const queryParams = {
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search || undefined,
      productTypeId: query.productTypeId ? parseInt(query.productTypeId) : undefined,
    };

    return await this.appService.getProducts(queryParams);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: number,
    @Body() product: Partial<ProductDto>,
  ): Promise<ProductDto> {
    console.log('Patch product:', id);
    return await this.appService.updateProduct(id, product);
  }

  @Post()
  async createProduct(@Body() product: ProductDto): Promise<ProductDto> {
    console.log('Post product');
    return await this.appService.createProduct(product);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: number): Promise<void> {
    console.log('Delete product:', id);
    return await this.appService.deleteProduct(id);
  }
}