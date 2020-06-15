import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionRepostory = getRepository(Transaction);
    const transactions = await transactionRepostory.find();
    const income = transactions.reduce((sum: number, transaction) => {
      if (transaction.type === 'income') {
        return sum + transaction.value;
      }
      return sum;
    }, 0);

    const outcome = transactions.reduce((sum: number, transaction) => {
      if (transaction.type === 'outcome') {
        return sum + transaction.value;
      }
      return sum;
    }, 0);

    const balance = {
      income,
      outcome,
      total: income - outcome,
    };
    return balance;
  }
}

export default TransactionsRepository;
