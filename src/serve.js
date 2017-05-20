import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';

// this needs to load first
import './environment';
import v1Router from './v1.router';
import jwtStrategy from './Jwt.auth';
import * as errors from './errors';

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

//auth
passport.use(jwtStrategy);
app.use(passport.initialize());

// routes
app.options('*', (req, res) => { res.status(200).end(); });
app.use('/api/v1', v1Router);

// set up 404 response
app.use('/', (req, res) => {
  errors.sendError(res)(new errors.NotFoundError('Lucy running, endpoint not found'));
});

const port = process.env.PORT || 8000;

const quotes = [
  'Everyone is entitled to my opinion.',
  'I never made a mistake in my life. I thought I did once, but I was wrong.',
  'When I was your age, I was dumb too.',
  'My time is valuable. Five dollars and I\'m all ears.',
  'If everyone agreed with me, they\'d all be right!',
];
const qIndex = Math.floor(Math.random() * quotes.length);

// start the express application
app.listen(port, () => {
  console.log(`The psychiatrist is [in] on port ${port}.\n"${quotes[qIndex]}" - Lucy`);
});
