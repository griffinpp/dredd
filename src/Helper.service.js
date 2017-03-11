export function exists(item) {
  if (typeof item !== 'undefined' && item !== null && !Number.isNaN(item)) {
    return true;
  }
  return false;
}
