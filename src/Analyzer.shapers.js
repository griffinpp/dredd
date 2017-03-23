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
  const id = exists(data.id) ? data.id : data._id;
  const { analyzerId } = splitAnalyzerId(id);
  const name = exists(data.doc) ? data.doc.name : data.name;
  return {
    id: analyzerId,
    name,
  };
}
