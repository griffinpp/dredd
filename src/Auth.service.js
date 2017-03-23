import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { fetchRecord } from './Analyzer.dbService';
import { exists } from './Helper.service';
import { UnauthorizedError } from './errors';

// eslint-disable-next-line
export async function login(userId, password) {
  const user = await fetchRecord(userId);
  if (!exists(user) || user.type !== 'user') {
    throw new UnauthorizedError('Username or password did not match');
  }
  if (!bcrypt.compareSync(password, user.password)) {
    throw new UnauthorizedError('Username or password did not match');
  }
  // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
  const payload = { userId: user._id };
  // TODO: put secret into environment
  const token = jwt.sign(payload, 'replaceMeWithARandomString');
  return {
    message: 'ok',
    token,
  };
}
