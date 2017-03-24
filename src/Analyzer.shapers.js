import { exists, splitAnalyzerId } from './Helper.service';

// eslint-disable-next-line
export function shapeOutgoingCategoryInfo(data) {
  return {
    category: data.category,
    relativeProbability: data.relativeProbability,
  };
}

export function shapeOutgoingUserId(data) {
  return {
    userId: data,
  };
}

export function shapeOutgoingAnalyzerArray(data) {
  return data.map((item) => {
    return shapeOutgoingAnalyzer(item);
  });
}

export function shapeOutgoingAnalyzer(data) {
  const id = data.id;
  const { analyzerId } = splitAnalyzerId(id);
  const name = data.doc.name;
  const categories = exists(data.doc.categories) ? data.doc.categories : undefined;
  return {
    id: analyzerId,
    name,
    categories,
  };
}
