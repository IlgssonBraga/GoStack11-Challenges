import { getRepository } from 'typeorm';
import { isUuid } from 'uuidv4';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getRepository(Transaction);

    if (!isUuid(id)) {
      throw new AppError('ID type Invalid', 400);
    }

    const checkId = await transactionRepository.findOne({ where: { id } });

    if (!checkId) {
      throw new AppError('Transaction inexistent', 401);
    }

    await transactionRepository.delete(checkId.id);
  }
}

export default DeleteTransactionService;
