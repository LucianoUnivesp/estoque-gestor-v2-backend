export class StockMovementDto {
  id: number;
  type: 'entry' | 'exit';
  quantity: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    costPrice: number;
    salePrice: number;
    productType?: {
      id: number;
      name: string;
    };
  };
  notes?: string;
  createdAt: string;
}
