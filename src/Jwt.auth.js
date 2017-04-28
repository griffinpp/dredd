import Jwt from 'passport-jwt';

import { fetchRecord } from './Analyzer.dbService';
import { exists } from './Helper.service';

const opts = {};
// this is the extractor.  We expect the token to be in the 'Authorization' property of the header
opts.jwtFromRequest = Jwt.ExtractJwt.fromAuthHeader();
opts.secretOrKey = process.env.JWT_SECRET;

const handler = async (payload, next) => {
  try {
    const user = await fetchRecord(payload.userId);
    if (!exists(user) || !exists(user.type) || user.type !== 'user') {
      next(null, false);
    } else {
      next(null, { userId: payload.userId });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const strategy = new Jwt.Strategy(opts, handler);

export default strategy;
