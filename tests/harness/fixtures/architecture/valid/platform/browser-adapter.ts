import { formatTimestamp } from '../shared/utils';

export function getBrowserStorageValue(key: string): string | null {
  return `value-for-${key}-at-${formatTimestamp()}`;
}
