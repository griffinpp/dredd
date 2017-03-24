import express from 'express';
import passport from 'passport';
import analyzerRouter from './Analyzer.router';
import * as aController from './Analyzer.controller';
import * as authController from './Auth.controller';

// eslint-disable-next-line new-cap
const router = express.Router();


// auth endpoints
router.post('/login', authController.loginUser);
router.get('/testLogin', passport.authenticate('jwt', { session: false }), authController.testLogin);

// TODO: probably need some sort of rate limiter for this eventually, since it is an open endpoint and a potential vector for DOS...
router.post('/user', aController.createUser);

router.use('/analyzers', passport.authenticate('jwt', { session: false }), analyzerRouter);


export default router;
