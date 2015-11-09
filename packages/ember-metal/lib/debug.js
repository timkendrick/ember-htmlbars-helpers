export function assert(message, condition) {
  if (!condition) { throw new Error(message); }
}
