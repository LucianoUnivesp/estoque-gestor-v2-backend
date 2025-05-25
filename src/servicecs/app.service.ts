import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.config';
import { ProductDto } from '../dtos/product.dto';
import { ProductTypeDto } from '../dtos/productType.dto';
import { StockMovementDto } from 'src/dtos/stockMovement.dto';

interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  productTypeId?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class AppService {
  constructor(private readonly supabaseService: SupabaseService) { }

  // Product Types Methods
  async getProductTypes(query?: PaginationQuery): Promise<any> {
    try {
      // Check if pagination is needed
      const needsPagination = query && typeof query.page === 'number' && typeof query.limit === 'number';

      let supabaseQuery = this.supabaseService.client
        .from('product_types')
        .select('*', { count: needsPagination ? 'exact' : undefined });

      // Add search filter
      if (query?.search) {
        supabaseQuery = supabaseQuery.ilike('name', `%${query.search}%`);
      }

      if (needsPagination) {
        const page = Math.max(1, query.page!);
        const limit = Math.min(100, Math.max(1, query.limit!));
        const offset = (page - 1) * limit;

        supabaseQuery = supabaseQuery
          .range(offset, offset + limit - 1)
          .order('name');

        const { data, error, count } = await supabaseQuery;

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
          data: data.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        };
      } else {
        // Return all items without pagination
        supabaseQuery = supabaseQuery.order('name');
        const { data, error } = await supabaseQuery;

        if (error) throw error;

        return data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
        }));
      }
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar tipos de produto: ${error.message}`,
      );
    }
  }

  async createProductType(
    productType: ProductTypeDto,
  ): Promise<ProductTypeDto> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('product_types')
        .insert([
          {
            name: productType.name,
            description: productType.description,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException(
          'Já existe um tipo de produto com esse nome',
        );
      }
      throw new BadRequestException(
        `Erro ao criar tipo de produto: ${error.message}`,
      );
    }
  }

  async updateProductType(
    id: number,
    data: Partial<ProductTypeDto>,
  ): Promise<ProductTypeDto> {
    try {
      const { data: updatedData, error } = await this.supabaseService.client
        .from('product_types')
        .update({
          name: data.name,
          description: data.description,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!updatedData) {
        throw new NotFoundException('Tipo de produto não encontrado');
      }

      return {
        id: updatedData.id,
        name: updatedData.name,
        description: updatedData.description,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error.code === '23505') {
        throw new BadRequestException(
          'Já existe um tipo de produto com esse nome',
        );
      }
      throw new BadRequestException(
        `Erro ao atualizar tipo de produto: ${error.message}`,
      );
    }
  }

  async deleteProductType(id: number): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('product_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      if (error.code === '23503') {
        throw new BadRequestException(
          'Não é possível excluir este tipo de produto pois existem produtos associados a ele',
        );
      }
      throw new BadRequestException(
        `Erro ao excluir tipo de produto: ${error.message}`,
      );
    }
  }

  // Products Methods
  async getProducts(query?: PaginationQuery): Promise<any> {
    try {
      // Check if pagination is needed
      const needsPagination = query && typeof query.page === 'number' && typeof query.limit === 'number';

      let supabaseQuery = this.supabaseService.client
        .from('products')
        .select(
          `
          *,
          product_types (
            id,
            name,
            description
          )
        `,
          { count: needsPagination ? 'exact' : undefined }
        );

      // Add search filter
      if (query?.search) {
        supabaseQuery = supabaseQuery.ilike('name', `%${query.search}%`);
      }

      // Add product type filter
      if (query?.productTypeId) {
        supabaseQuery = supabaseQuery.eq('product_type_id', query.productTypeId);
      }

      if (needsPagination) {
        const page = Math.max(1, query.page!);
        const limit = Math.min(100, Math.max(1, query.limit!));
        const offset = (page - 1) * limit;

        supabaseQuery = supabaseQuery
          .range(offset, offset + limit - 1)
          .order('name');

        const { data, error, count } = await supabaseQuery;

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
          data: data.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            quantity: item.quantity,
            expirationDate: item.expiration_date,
            supplier: item.supplier,
            productTypeId: item.product_type_id,
            productType: item.product_types
              ? {
                id: item.product_types.id,
                name: item.product_types.name,
                description: item.product_types.description,
              }
              : undefined,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        };
      } else {
        // Return all items without pagination
        supabaseQuery = supabaseQuery.order('name');
        const { data, error } = await supabaseQuery;

        if (error) throw error;

        return data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          quantity: item.quantity,
          expirationDate: item.expiration_date,
          supplier: item.supplier,
          productTypeId: item.product_type_id,
          productType: item.product_types
            ? {
              id: item.product_types.id,
              name: item.product_types.name,
              description: item.product_types.description,
            }
            : undefined,
        }));
      }
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar produtos: ${error.message}`,
      );
    }
  }

  async createProduct(product: ProductDto): Promise<ProductDto> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('products')
        .insert([
          {
            name: product.name,
            description: product.description,
            price: product.price,
            quantity: product.quantity,
            expiration_date: product.expirationDate,
            supplier: product.supplier,
            product_type_id: product.productTypeId,
          },
        ])
        .select(
          `
          *,
          product_types (
            id,
            name,
            description
          )
        `,
        )
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        quantity: data.quantity,
        expirationDate: data.expiration_date,
        supplier: data.supplier,
        productTypeId: data.product_type_id,
        productType: data.product_types
          ? {
            id: data.product_types.id,
            name: data.product_types.name,
            description: data.product_types.description,
          }
          : undefined,
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Já existe um produto com esse nome');
      }
      if (error.code === '23503') {
        throw new BadRequestException('Tipo de produto não encontrado');
      }
      throw new BadRequestException(`Erro ao criar produto: ${error.message}`);
    }
  }

  async updateProduct(
    id: number,
    data: Partial<ProductDto>,
  ): Promise<ProductDto> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.expirationDate !== undefined)
        updateData.expiration_date = data.expirationDate;
      if (data.supplier !== undefined) updateData.supplier = data.supplier;
      if (data.productTypeId !== undefined)
        updateData.product_type_id = data.productTypeId;

      const { data: updatedData, error } = await this.supabaseService.client
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          product_types (
            id,
            name,
            description
          )
        `,
        )
        .single();

      if (error) throw error;

      if (!updatedData) {
        throw new NotFoundException('Produto não encontrado');
      }

      return {
        id: updatedData.id,
        name: updatedData.name,
        description: updatedData.description,
        price: parseFloat(updatedData.price),
        quantity: updatedData.quantity,
        expirationDate: updatedData.expiration_date,
        supplier: updatedData.supplier,
        productTypeId: updatedData.product_type_id,
        productType: updatedData.product_types
          ? {
            id: updatedData.product_types.id,
            name: updatedData.product_types.name,
            description: updatedData.product_types.description,
          }
          : undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error.code === '23505') {
        throw new BadRequestException('Já existe um produto com esse nome');
      }
      if (error.code === '23503') {
        throw new BadRequestException('Tipo de produto não encontrado');
      }
      throw new BadRequestException(
        `Erro ao atualizar produto: ${error.message}`,
      );
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      if (error.code === '23503') {
        throw new BadRequestException(
          'Não é possível excluir este produto pois existem movimentações associadas a ele',
        );
      }
      throw new BadRequestException(
        `Erro ao excluir produto: ${error.message}`,
      );
    }
  }

  // Stock Movements (mantido igual pois não tem problemas)
  async getStockMovements(startDate?: string, endDate?: string) {
    try {
      let query = this.supabaseService.client
        .from('stock_movements')
        .select(
          `
        *,
        products (
          id,
          name,
          price,
          product_types (
            id,
            name
          )
        )
      `,
        )
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59.999Z');
      }

      const { data, error } = await query;

      if (error) throw error;

      const movements = data.map((item) => ({
        id: item.id,
        type: item.type,
        quantity: item.quantity,
        productId: item.product_id,
        notes: item.notes,
        createdAt: item.created_at,
        product: item.products
          ? {
            id: item.products.id,
            name: item.products.name,
            price: parseFloat(item.products.price),
            productType: item.products.product_types
              ? {
                id: item.products.product_types.id,
                name: item.products.product_types.name,
              }
              : undefined,
          }
          : undefined,
      }));

      // Calculate summary
      const entries = movements.filter((m) => m.type === 'entry');
      const exits = movements.filter((m) => m.type === 'exit');

      const entriesQuantity = entries.reduce((sum, m) => sum + m.quantity, 0);
      const exitsQuantity = exits.reduce((sum, m) => sum + m.quantity, 0);
      const entriesValue = entries.reduce(
        (sum, m) => sum + m.quantity * (m.product?.price || 0),
        0,
      );
      const exitsValue = exits.reduce(
        (sum, m) => sum + m.quantity * (m.product?.price || 0),
        0,
      );

      return {
        movements,
        summary: {
          entries: entriesQuantity,
          exits: exitsQuantity,
          balance: entriesQuantity - exitsQuantity,
          entriesValue,
          exitsValue,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar movimentações: ${error.message}`,
      );
    }
  }

  async createStockMovement(
    stockMovement: StockMovementDto,
  ): Promise<StockMovementDto> {
    const supabase = this.supabaseService.client;

    try {
      // Validate product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', stockMovement.productId)
        .single();

      if (productError || !product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Check if exit quantity is available
      if (
        stockMovement.type === 'exit' &&
        product.quantity < stockMovement.quantity
      ) {
        throw new BadRequestException('Quantidade insuficiente em estoque');
      }

      // Create stock movement
      const { data: movementData, error: movementError } = await supabase
        .from('stock_movements')
        .insert([
          {
            type: stockMovement.type,
            quantity: stockMovement.quantity,
            product_id: stockMovement.productId,
            notes: stockMovement.notes || null,
          },
        ])
        .select(
          `
        *,
        products (
          id,
          name,
          price,
          product_types (
            id,
            name
          )
        )
      `,
        )
        .single();

      if (movementError) throw movementError;

      // Update product quantity
      const newQuantity =
        stockMovement.type === 'entry'
          ? product.quantity + stockMovement.quantity
          : product.quantity - stockMovement.quantity;

      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', stockMovement.productId);

      if (updateError) throw updateError;

      return {
        id: movementData.id,
        type: movementData.type,
        quantity: movementData.quantity,
        productId: movementData.product_id,
        notes: movementData.notes,
        createdAt: movementData.created_at,
        product: movementData.products
          ? {
            id: movementData.products.id,
            name: movementData.products.name,
            price: parseFloat(movementData.products.price),
            productType: movementData.products.product_types
              ? {
                id: movementData.products.product_types.id,
                name: movementData.products.product_types.name,
              }
              : undefined,
          }
          : undefined,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao criar movimentação: ${error.message}`,
      );
    }
  }

  async updateStockMovement(
    id: number,
    data: Partial<StockMovementDto>,
  ): Promise<StockMovementDto> {
    try {
      // Get original movement to calculate quantity changes
      const { data: originalMovement, error: originalError } =
        await this.supabaseService.client
          .from('stock_movements')
          .select(
            `
        *,
        products (id, quantity)
      `,
          )
          .eq('id', id)
          .single();

      if (originalError || !originalMovement) {
        throw new NotFoundException('Movimentação não encontrada');
      }

      // Calculate the difference in quantities and update product stock
      if (
        data.quantity !== undefined &&
        data.quantity !== originalMovement.quantity
      ) {
        const quantityDiff = data.quantity - originalMovement.quantity;
        const product = originalMovement.products;

        let newProductQuantity = product.quantity;

        if (originalMovement.type === 'entry') {
          newProductQuantity += quantityDiff;
        } else {
          newProductQuantity -= quantityDiff;
        }

        if (newProductQuantity < 0) {
          throw new BadRequestException(
            'Operação resultaria em estoque negativo',
          );
        }

        // Update product quantity
        const { error: productUpdateError } = await this.supabaseService.client
          .from('products')
          .update({ quantity: newProductQuantity })
          .eq('id', originalMovement.product_id);

        if (productUpdateError) throw productUpdateError;
      }

      // Update the movement
      const updateData: any = {};
      if (data.type !== undefined) updateData.type = data.type;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { data: updatedData, error } = await this.supabaseService.client
        .from('stock_movements')
        .update(updateData)
        .eq('id', id)
        .select(
          `
        *,
        products (
          id,
          name,
          price,
          product_types (
            id,
            name
          )
        )
      `,
        )
        .single();

      if (error) throw error;

      return {
        id: updatedData.id,
        type: updatedData.type,
        quantity: updatedData.quantity,
        productId: updatedData.product_id,
        notes: updatedData.notes,
        createdAt: updatedData.created_at,
        product: updatedData.products
          ? {
            id: updatedData.products.id,
            name: updatedData.products.name,
            price: parseFloat(updatedData.products.price),
            productType: updatedData.products.product_types
              ? {
                id: updatedData.products.product_types.id,
                name: updatedData.products.product_types.name,
              }
              : undefined,
          }
          : undefined,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao atualizar movimentação: ${error.message}`,
      );
    }
  }

  async deleteStockMovement(id: number): Promise<void> {
    try {
      // Get movement data before deletion to revert stock changes
      const { data: movement, error: getError } =
        await this.supabaseService.client
          .from('stock_movements')
          .select(
            `
        *,
        products (id, quantity)
      `,
          )
          .eq('id', id)
          .single();

      if (getError || !movement) {
        throw new NotFoundException('Movimentação não encontrada');
      }

      // Calculate new product quantity (reverse the movement)
      const product = movement.products;
      let newQuantity = product.quantity;

      if (movement.type === 'entry') {
        newQuantity -= movement.quantity;
      } else {
        newQuantity += movement.quantity;
      }

      if (newQuantity < 0) {
        throw new BadRequestException(
          'Não é possível excluir esta movimentação pois resultaria em estoque negativo',
        );
      }

      // Update product quantity
      const { error: updateError } = await this.supabaseService.client
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', movement.product_id);

      if (updateError) throw updateError;

      // Delete the movement
      const { error: deleteError } = await this.supabaseService.client
        .from('stock_movements')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao excluir movimentação: ${error.message}`,
      );
    }
  }

  // Dashboard Methods
  async getDashboardStats() {
    try {
      // Get total products
      const { count: totalProducts, error: productsError } =
        await this.supabaseService.client
          .from('products')
          .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Get total product types
      const { count: totalProductTypes, error: typesError } =
        await this.supabaseService.client
          .from('product_types')
          .select('*', { count: 'exact', head: true });

      if (typesError) throw typesError;

      // Get low stock products
      const { count: lowStockProducts, error: lowStockError } =
        await this.supabaseService.client
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('quantity', 5);

      if (lowStockError) throw lowStockError;

      // Get today's movements
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMovements, error: movementsError } =
        await this.supabaseService.client
          .from('stock_movements')
          .select(
            `
        *,
        products (
          price
        )
      `,
          )
          .gte('created_at', today)
          .lt('created_at', today + 'T23:59:59.999Z');

      if (movementsError) throw movementsError;

      const todayEntries = todayMovements.filter((m) => m.type === 'entry');
      const todayExits = todayMovements.filter((m) => m.type === 'exit');

      const todayEntriesQuantity = todayEntries.reduce(
        (sum, m) => sum + m.quantity,
        0,
      );
      const todayExitsQuantity = todayExits.reduce(
        (sum, m) => sum + m.quantity,
        0,
      );
      const todayEntriesValue = todayEntries.reduce(
        (sum, m) => sum + m.quantity * parseFloat(m.products?.price || '0'),
        0,
      );
      const todayExitsValue = todayExits.reduce(
        (sum, m) => sum + m.quantity * parseFloat(m.products?.price || '0'),
        0,
      );

      return {
        totalProducts: totalProducts || 0,
        totalProductTypes: totalProductTypes || 0,
        lowStockProducts: lowStockProducts || 0,
        todayEntries: todayEntriesQuantity,
        todayExits: todayExitsQuantity,
        todayBalance: todayEntriesQuantity - todayExitsQuantity,
        todayEntriesValue,
        todayExitsValue,
      };
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar estatísticas do dashboard: ${error.message}`,
      );
    }
  }

  async getRecentMovements() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('stock_movements')
        .select(
          `
        *,
        products (
          name
        )
      `,
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map((movement) => ({
        id: movement.id,
        product: { name: movement.products?.name },
        type: movement.type,
        quantity: movement.quantity,
        createdAt: movement.created_at,
      }));
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar movimentações recentes: ${error.message}`,
      );
    }
  }

  async getStockTrend() {
    try {
      // Get movements from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await this.supabaseService.client
        .from('stock_movements')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by date
      const trendData = [];
      const dates = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      dates.forEach((date) => {
        const dayMovements = data.filter(
          (m) => m.created_at.split('T')[0] === date,
        );

        const entries = dayMovements
          .filter((m) => m.type === 'entry')
          .reduce((sum, m) => sum + m.quantity, 0);
        const exits = dayMovements
          .filter((m) => m.type === 'exit')
          .reduce((sum, m) => sum + m.quantity, 0);

        trendData.push({
          date: new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          entries,
          exits,
          balance: entries - exits,
        });
      });

      return trendData;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar tendência de estoque: ${error.message}`,
      );
    }
  }
}