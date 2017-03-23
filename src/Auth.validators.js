import { BadRequestError } from './errors';
import { exists } from './Helper.service';

// eslint-disable-next-line
export function validatePasswordMatch(password1, password2) {
  if (password1 !== password2) {
    throw new BadRequestError('Passwords do not match');
  }
}

export function validatePasswordsExist(password1, password2) {
  if (!exists(password1) || !exists(password2)) {
    throw new BadRequestError('Cannot create a user account without a password');
  }
}
