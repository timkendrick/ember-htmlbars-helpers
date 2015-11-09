var IS_GLOBAL = /^[A-Z$]/;
var HAS_THIS = 'this.';

export function isGlobal(key) {
  return IS_GLOBAL.test(key);
}

export function hasThis(key) {
  return key.lastIndexOf(HAS_THIS, 0) === 0;
}

export function isPath(key) {
  return key.indexOf('.') !== -1;
}
