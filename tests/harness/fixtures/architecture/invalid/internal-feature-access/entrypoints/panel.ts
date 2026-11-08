// ARC-R02: Entrypoint importando arquivo interno de feature ignorando o index.ts público
import { Button } from '../features/sample/ui/Button';

export function renderSidepanel() {
  return Button();
}
