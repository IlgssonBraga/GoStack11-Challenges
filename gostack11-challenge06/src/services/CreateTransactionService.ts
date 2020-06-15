import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const balance = await transactionsRepository.getBalance();
    let searchCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!searchCategory) {
      searchCategory = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(searchCategory);
    }

    if (type === 'outcome' && balance.total < value) {
      throw new AppError(
        'Transaction not allowed. Cash value less than outcome',
        400,
      );
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid type', 400);
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: searchCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
