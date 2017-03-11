import * as aService from './Analyzer.service';
import * as errors from './errors';
import * as successes from './successes';
import Shuttle from './Shuttle';

export function categorize(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.debug)
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function categorizeAndLearn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function learn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function unlearn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function recategorize(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function getAllAnalyzers(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function deleteAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function createAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function editAnalyzerName(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}
