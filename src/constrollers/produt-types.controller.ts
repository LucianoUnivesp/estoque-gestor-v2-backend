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
import { ProductTypeDto } from '../dtos/productType.dto';
import { AppService } from 'src/servicecs/app.service';

interface ProductTypeQueryParams {
  page?: string;
  limit?: string;
  search?: string;
}

@Controller('api/product-types')
export class ProductTypesController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async getProductTypes(@Query() query: ProductTypeQueryParams) {
    console.log('Get product-types with query:', query);

    const queryParams = {
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search || undefined,
    };

    return await this.appService.getProductTypes(queryParams);
  }

  @Post()
  async createProductType(
    @Body() productType: ProductTypeDto,
  ): Promise<ProductTypeDto> {
    console.log('Post product type');
    return await this.appService.createProductType(productType);
  }

  @Delete(':id')
  async deleteProductType(@Param('id') id: number): Promise<void> {
    console.log('Delete product type:', id);
    return await this.appService.deleteProductType(id);
  }

  @Patch(':id')
  async updateProductType(
    @Param('id') id: number,
    @Body() productType: Partial<ProductTypeDto>,
  ): Promise<ProductTypeDto> {
    console.log('Update product type:', id);
    return await this.appService.updateProductType(id, productType);
  }
}