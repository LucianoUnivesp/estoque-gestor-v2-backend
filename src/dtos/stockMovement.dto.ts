import { ProductDto } from './product.dto';

export class StockMovementDto {
  id: number;
  type: 'entry' | 'exit';
  quantity: number;
  productId: number;
  product?: ProductDto;
  notes?: string;
  createdAt: string;
}
