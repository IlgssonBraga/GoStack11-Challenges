import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer invalid');
    }

    const prod = await this.productsRepository.findAllById(
      products.map(product => ({
        id: product.id,
      })),
    );

    if (prod.length !== products.length) {
      throw new AppError('Invalid products');
    }

    const alteredQuantities: Product[] = [];

    const alteredProducts = prod.map(prods => {
      const productByOrder = products.find(product => product.id === prods.id);

      if (productByOrder) {
        if (productByOrder.quantity > prods.quantity) {
          throw new AppError('Invalid quantity');
        }
        alteredQuantities.push({
          ...prods,
          quantity: prods.quantity - productByOrder.quantity,
        });
        return {
          ...prods,
          quantity: productByOrder.quantity,
        };
      }
      return prods;
    });

    const order = await this.ordersRepository.create({
      customer,
      products: alteredProducts.map(altered => ({
        product_id: altered.id,
        price: altered.price,
        quantity: altered.quantity,
      })),
    });

    await this.productsRepository.updateQuantity(alteredQuantities);

    return order;
  }
}

export default CreateProductService;
