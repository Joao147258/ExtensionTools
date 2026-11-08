import { funcB } from './node-b';

export function funcA(): string {
  return `A -> ${funcB()}`;
}
