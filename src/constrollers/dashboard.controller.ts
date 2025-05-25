import { Controller, Get } from '@nestjs/common';
import { AppService } from 'src/servicecs/app.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly appService: AppService) {}

  @Get('stats')
  async getDashboardStats() {
    console.log('Get dashboard stats');
    return await this.appService.getDashboardStats();
  }

  @Get('recent-movements')
  async getRecentMovements() {
    console.log('Get recent movements');
    return await this.appService.getRecentMovements();
  }

  @Get('stock-trend')
  async getStockTrend() {
    console.log('Get stock trend');
    return await this.appService.getStockTrend();
  }

  @Get('product-type-distribution')
  async getProductTypeDistribution() {
    console.log('Get product type distribution');
    return await this.appService.getProductTypeDistribution();
  }
}
