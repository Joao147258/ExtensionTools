// ARC-R01: Importação cruzada ilegal entre features distintas
import { helperB } from '../feat-b/engine';

export function runFeatureA(): string {
  return `FeatureA -> ${helperB()}`;
}
