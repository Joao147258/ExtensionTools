// ARC-R05: Shared importando camada superior (platform)
import { getStorage } from '../platform/storage';

export function sharedHelper() {
  return getStorage();
}
