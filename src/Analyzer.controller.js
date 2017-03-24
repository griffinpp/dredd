import * as aService from './Analyzer.service';
import * as aDbService from './Analyzer.dbService';
import * as errors from './errors';
import * as successes from './successes';
import * as shaper from './Analyzer.shapers';
import { validatePasswordsExist, validatePasswordMatch } from './Auth.validators';
import Shuttle from './Shuttle';

// TODO: some validation on incoming data

export function createUser(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(validatePasswordsExist, 'data.password1', 'data.password2'))
    .then(Shuttle.liftSideEffectFunction(validatePasswordMatch, 'data.password1', 'data.password2'))
    .then(Shuttle.liftMutatingFunction('data', aDbService.addUser, 'data.name', 'data.password1'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingUserId, 'data'))
    .then(successes.sendCreated(res))
    .catch(errors.sendError(res));
}

export function categorize(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aService.categorize, 'requester.userId', 'params.analyzerId', 'data.text'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingCategoryInfo, 'data'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function learn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aService.learn, 'requester.userId', 'params.analyzerId', 'data.text', 'data.category'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}

export function unlearn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aService.unlearn, 'requester.userId', 'params.analyzerId', 'data.text', 'data.category'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}

export function relearn(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aService.relearn, 'requester.userId', 'params.analyzerId', 'data.text', 'data.oldCategory', 'data.newCategory'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}

export function createAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.addAnalyzer, 'requester.userId', 'data.name', 'data.categories'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzer, 'data'))
    .then(successes.sendCreated(res))
    .catch(errors.sendError(res));
}

export function getAnalyzers(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.fetchAnalyzerRecords, 'requester.userId'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzerArray, 'data.rows'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function getAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.fetchAnalyzer, 'requester.userId', 'params.analyzerId'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzer, 'data'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function editAnalyzerName(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', aDbService.editAnalyzerName, 'requester.userId', 'params.analyzerId', 'data.name'))
    .then(Shuttle.liftMutatingFunction('data', shaper.shapeOutgoingAnalyzer, 'data'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function removeAnalyzer(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftSideEffectFunction(aDbService.removeAnalyzer, 'requester.userId', 'params.analyzerId'))
    .then(successes.sendSuccessNoData(res))
    .catch(errors.sendError(res));
}
