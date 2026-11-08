// ARC-R04: Application importando diretamente infraestrutura em vez de port/interface
import { OrderRepositoryAdapter } from '../infrastructure/order-repository';

export function processOrder(orderId: string) {
  const repo = new OrderRepositoryAdapter();
  return repo.save(orderId);
}
