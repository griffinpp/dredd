import express from 'express';
import bodyParser from 'body-parser';

import v1Router from './v1.router';
import * as errors from './errors';

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.options('*', (req, res) => { res.status(200).end(); });
app.use('/api/v1', v1Router);

// set up 404 response
app.use('/', (req, res) => {
  errors.sendError(res)(new errors.NotFoundError('Lucy running, endpoint not found'));
});

const port = process.env.PORT || 8000;

// start the express application
app.listen(port, () => {
  console.log(`Lucy listening on port ${port}. The doctor is in!`);
});
