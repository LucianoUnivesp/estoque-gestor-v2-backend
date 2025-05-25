import { ProductTypeDto } from './productType.dto';

export class ProductDto {
  id: number;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  quantity?: number;
  expirationDate?: string;
  supplier?: string;
  productTypeId?: number;
  productType?: ProductTypeDto;
  profitMargin?: number;
  profitValue?: number;
  price?: number
}
