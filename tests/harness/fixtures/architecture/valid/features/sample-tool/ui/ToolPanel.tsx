import {
  ActionButton,
} from './Button';
import type {
  ToolConfig,
} from '../core/types';
import { executeSampleAlgorithm } from '../core/engine';
import { formatTimestamp } from '@shared/utils';

export function ToolPanel(config: ToolConfig) {
  const result = executeSampleAlgorithm('test', 'fast');
  const renderedAt = formatTimestamp();
  return {
    config,
    result,
    renderedAt,
    button: ActionButton({ label: 'Execute', onClick: () => {} }),
  };
}
