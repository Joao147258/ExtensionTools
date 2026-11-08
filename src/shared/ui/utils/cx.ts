/**
 * Concatena condicionalmente classes CSS filtrando valores falsy.
 * Evita a necessidade de bibliotecas de terceiros como clsx ou classnames.
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
