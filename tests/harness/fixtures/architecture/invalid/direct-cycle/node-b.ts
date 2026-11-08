import { funcA } from './node-a';

export function funcB(): string {
  return `B -> ${funcA()}`;
}
