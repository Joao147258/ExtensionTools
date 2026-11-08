import { ToolPanel, defaultSampleConfig } from '@/features/sample-tool/index';
import { getBrowserStorageValue } from '@/platform/browser-adapter';

export function initializeSidepanel() {
  const cached = getBrowserStorageValue('settings');
  return ToolPanel(defaultSampleConfig);
}
