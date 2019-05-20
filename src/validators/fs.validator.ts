export function pathValidator(filename: string): boolean {

  return ! /\.\.\//g.test(filename) && ! /\.\.$/.test(filename) && ! /\\/.test(filename);

}
