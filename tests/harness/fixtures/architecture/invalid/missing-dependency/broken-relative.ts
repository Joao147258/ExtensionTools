// Import relativo apontando para arquivo local inexistente
import { missingHelper } from './does-not-exist';

export function runMissing() {
  return missingHelper();
}
