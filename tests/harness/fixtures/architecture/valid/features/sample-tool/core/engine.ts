import type { ToolConfig, OperationMode } from './types';

export function executeSampleAlgorithm(input: string, mode: OperationMode): string {
  return `[${mode}] Processed: ${input}`;
}

export const defaultSampleConfig: ToolConfig = {
  id: 'sample-tool',
  name: 'Sample Tool',
  enabled: true,
};
