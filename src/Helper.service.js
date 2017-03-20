export function exists(item) {
  if (typeof item !== 'undefined' && item !== null && !Number.isNaN(item)) {
    return true;
  }
  return false;
}

export function splitAnalyzerId(id) {
  const split = id.split('/');
  return {
    userId: split[0],
    analyzerId: split[1]
  };
}
