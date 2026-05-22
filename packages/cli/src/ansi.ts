/**
 * Tiny ANSI color helpers. Zero dependencies.
 * Respects NO_COLOR and non-TTY environments.
 */
const enabled = (() => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return process.stdout.isTTY === true;
})();

function wrap(open: number, close: number): (s: string) => string {
  return (s: string): string =>
    enabled ? `\x1b[${open}m${s}\x1b[${close}m` : s;
}

export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const blue = wrap(34, 39);
export const cyan = wrap(36, 39);
