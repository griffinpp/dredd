import Shuttle from './Shuttle';
import { login } from './Auth.service';
import * as successes from './successes';
import * as errors from './errors';

// eslint-disable-next-line
export function loginUser(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.liftMutatingFunction('data', login, 'data.userId', 'data.password'))
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}

export function testLogin(req, res) {
  return Promise.resolve(Shuttle.liftRequest(req))
    .then(Shuttle.debug)
    .then(successes.sendSuccess(res))
    .catch(errors.sendError(res));
}
