import { ToolPanel } from '@/features/sample-tool';

export function executeConsumer() {
  return ToolPanel({ id: 'demo', name: 'Demo', enabled: true });
}
