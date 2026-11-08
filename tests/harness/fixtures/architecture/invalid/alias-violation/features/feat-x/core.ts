// ARC-R08: Tentativa de contornar isolamento entre features utilizando alias @/*
import { helperY } from '@/features/feat-y/index';

export function runX() {
  return helperY();
}
