import { funcBeta } from './beta';

export function funcAlpha(): string {
  return `Alpha -> ${funcBeta()}`;
}
