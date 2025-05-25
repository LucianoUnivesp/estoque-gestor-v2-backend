import { ProductTypeDto } from './productType.dto';

export class ProductDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  expirationDate?: string;
  supplier?: string;
  productTypeId?: number;
  productType?: ProductTypeDto;
}
