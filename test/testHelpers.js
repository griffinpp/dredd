/** Runs an arbitrary test after a promise fulfills. Can test any parameter, not just the promise.
 * Ideally, fn is an arrow function with an expect() expression.  The result of the promise will be passed as a
 * parameter into fn, so you can also test the result of the promise if you are so inclined, but this is better
 * handled by the chai-as-promised library.
 *
 * @promise {Promise} the promise to await
 * @fn {function} the function to execute when the promise fulfills
 * @done {function} the callback function for mocha to alert it that the test is complete
 */
 // eslint-disable-next-line
export function testAfterPromise(promise, fn, done) {
  promise.then((p) => {
    try {
      fn(p);
      done();
    } catch (err) {
      done(err);
    }
  }).catch((err) => {
    done(new Error(`Uncaught error was thrown: ${err.stack}`));
  });
}
