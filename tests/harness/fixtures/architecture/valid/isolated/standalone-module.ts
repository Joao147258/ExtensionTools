/**
 * Módulo puramente isolado para validação de nós órfãos no grafo de dependências.
 */
export function calculateIsolatedFactor(x: number, y: number): number {
  return x * y + 42;
}
