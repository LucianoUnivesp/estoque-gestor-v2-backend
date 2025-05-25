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
import { StockMovementDto } from 'src/dtos/stockMovement.dto';
import { AppService } from 'src/servicecs/app.service';

@Controller('api/stock-movements')
export class StockMovementsController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getStockMovements(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    console.log('Get stock movements');
    return await this.appService.getStockMovements(startDate, endDate);
  }

  @Post()
  async createStockMovement(
    @Body() stockMovement: StockMovementDto,
  ): Promise<StockMovementDto> {
    console.log('Post stock movement');
    return await this.appService.createStockMovement(stockMovement);
  }

  @Delete(':id')
  async deleteStockMovement(@Param('id') id: number): Promise<void> {
    console.log('Delete stock movement');
    return await this.appService.deleteStockMovement(id);
  }

  @Patch(':id')
  async updateStockMovement(
    @Param('id') id: number,
    @Body() stockMovement: Partial<StockMovementDto>,
  ): Promise<StockMovementDto> {
    console.log('Update stock movement');
    return await this.appService.updateStockMovement(id, stockMovement);
  }
}
