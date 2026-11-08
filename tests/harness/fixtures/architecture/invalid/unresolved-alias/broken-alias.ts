// Alias apontando para caminho inexistente no projeto
import { ghostFeature } from '@/phantom/non-existent-module';

export function runGhost() {
  return ghostFeature();
}
