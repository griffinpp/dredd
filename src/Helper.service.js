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
    analyzerId: split[1],
  };
}

export function resetNegative(number) {
  if (number < 0) {
    return 0;
  }
  return number;
}

// for searching sorted arrays in logarithmic time
export function binarySearchByKey(searchKey, array, key) {
  let lowerIndex = 0;
  let upperIndex = array.length - 1;
  while (upperIndex - lowerIndex > 1) {
    const i = lowerIndex + Math.floor((upperIndex - lowerIndex) / 2);
    if (array[i][key] === searchKey) {
      return array[i];
    } else if (array[upperIndex][key] === searchKey) {
      return array[upperIndex];
    } else if (array[lowerIndex][key] === searchKey) {
      return array[lowerIndex];
    } else if (array[i][key] > searchKey) {
      upperIndex = i;
    } else {
      lowerIndex = i;
    }
  }
  return null;
}

export function getCategoryDocs(array) {
  let i = 1;
  const results = [];
  while (i < array.length && array[i].doc.type === 'category') {
    results.push(array[i]);
    i += 1;
  }
  return results;
}
