
export function sendSuccess(res) {
  return (shuttle) => {
    res.status(200).json(shuttle.data);
    return null;
  };
}

export function sendSuccessNoData(res) {
  return () => {
    res.status(204).send();
    return null;
  };
}

export function sendCreated(res) {
  return (shuttle) => {
    res.status(201).json(shuttle.data);
    return null;
  };
}
