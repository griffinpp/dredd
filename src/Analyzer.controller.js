import * as aService from './Analyzer.service';
import * as aDbService from './Analyzer.dbService';
import * as errors from './errors';
import * as successes from './successes';
import * as shaper from './Analyzer.shapers';
import { splitAnalyzerId } from './Helper.service';
import Shuttle from './Shuttle';

export function createUser(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.addUser, 'data.name'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingUserId, 'data'))
    .then(successes.sendCreated(res))
    .catch(errors.sendError(res));
}

export function categorize(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aService.categorize, 'params.userId', 'params.analyzerId', 'data.text'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingCategoryInfo, 'data'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

// export function categorizeAndLearn(req, res) {
//   return Promise.resolve(Shuttle.liftRequest(req))
//     .then(successes.sendSuccess(res))
//     .catch(errors.sendError(res));
// }

export function learn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aService.learn, 'params.userId', 'params.analyzerId', 'data.text', 'data.category'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}

export function unlearn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aService.unlearn, 'params.userId', 'params.analyzerId', 'data.text', 'data.category'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}

export function relearn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aService.unlearn, 'params.userId', 'params.analyzerId', 'data.text', 'data.oldCategory'))
    .then(Shuttle.liftSideEffectFunction(aService.learn, 'params.userId', 'params.analyzerId', 'data.text', 'data.newCategory'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}

export function getAnalyzers(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.fetchAnalyzerRecords, 'params.userId'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzerArray, 'data.rows'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function createAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.addAnalyzer, 'params.userId', 'data.name', 'data.categories'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzer, 'data'))
    .then(successes.sendCreated(res))
    .catch(errors.sendError(res));
}

export function getAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.fetchAnalyzer, 'params.userId', 'params.analyzerId'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzer, 'data'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function editAnalyzerName(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.editAnalyzerName, 'params.userId', 'params.analyzerId', 'data.name'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzer, 'data'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function removeAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aDbService.removeAnalyzer, 'params.userId', 'params.analyzerId'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}
