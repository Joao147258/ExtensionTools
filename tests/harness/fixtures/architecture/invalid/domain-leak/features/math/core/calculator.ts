// ARC-R03: Arquivo de core/domain importando react e componente visual de ui/
import React from 'react';
import { Display } from '../ui/Display';

export function calculateWithDisplay(a: number, b: number) {
  const sum = a + b;
  return Display({ value: sum });
}
