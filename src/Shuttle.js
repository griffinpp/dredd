import * as helpers from './Helper.service';

export default function Shuttle() {
  this.params = {};
  this.query = {};
  this.data = {};
  this.requester = {};

// BEGIN MAPPING FUNCITONS

/* These functions can be used to transform the data inside of a Shuttle.  They all return a new Shuttle object
   rather than modifying the existing Shuttle in situ */

  this.mapData = (fn) => {
    const s = new Shuttle();
    s.data = fn(this.data);
    s.params = this.params;
    s.query = this.query;
    s.requester = this.requester;
    return Promise.resolve(s);
  };

  this.mapParams = (fn) => {
    const s = new Shuttle();
    s.data = this.data;
    s.params = fn(this.data);
    s.query = this.query;
    s.requester = this.requester;
    return Promise.resolve(s);
  };

  this.mapQuery = (fn) => {
    const s = new Shuttle();
    s.data = this.data;
    s.params = this.params;
    s.query = fn(this.data);
    s.requester = this.requester;
    return Promise.resolve(s);
  };

  this.mapRequester = (fn) => {
    const s = new Shuttle();
    s.data = this.data;
    s.params = this.params;
    s.query = this.query;
    s.requester = fn(this.data);
    return Promise.resolve(s);
  };

  this.debug = () => {
    console.info(JSON.stringify(this, null, 2));
  };
}

Shuttle.prototype = Object.create(Shuttle.prototype);
Shuttle.prototype.constructor = Shuttle;

/**
 * Wraps the passed data in a new Shuttle, in the .data property, and returns it in a Promise
 *
 * @param data{object} the data to wrap
 * @return {Shuttle} a new Shuttle with data in its .data property
 */
Shuttle.liftData = (data) => {
  const s = new Shuttle();
  s.data = data;
  return Promise.resolve(s);
};

/**
 * Maps specific parts of an express request object to a new Shuttle object
 *
 * @param req{object} an express request
 * @return {Shuttle} a new Shuttle with its .params, .query, .data, and .requester properties populated
 */
Shuttle.liftRequest = (req) => {
  const s = new Shuttle();
  s.params = req.params;
  s.data = req.body;
  s.rawData = req.rawBody;
  s.query = req.query;
  s.requester = req.user;
  s.requestUrlBase = `${req.protocol}://${req.headers.host}`;
  return Promise.resolve(s);
};

/**
 * Wraps an arbitrary function to receive and return a Shuttle object.  The data to be passed into the wrapped function must exist on
 * the incoming shuttle, and its location(s) must be specified in the order the function expects them.  The result of the function is
 * is returned in a new Shuttle, in the .data property
 *
 * example:
 *
 * function subtract(x, y) {
 *   return x - y;
 * }
 *
 * shuttleSubtract = Shuttle.liftFunction(subtract, 'params.x', 'params.y'); // order is important!
 *
 * // Now shuttleSubtract is a function that will take a Shuttle object as its input, subtract shuttle.params.y from shuttle.params.x,
 * // and return the result in a new shuttle, in the .data property.  So:
 *
 * const input = new Shuttle();
 * input.params = {
 *  x = 10,
 *  y = 4,
 * };
 *
 * const result = shuttleSubtract(input);
 * console.log(result.data) // outputs: 6
 *
 * This is extremely useful for making arbtrary functions chainable in controllers, which pass around Shuttle objects.
 *
 * @param {fn} the function to wrap
 * @param {string[]} the list of keys, in order, where values from the passed shuttle can be found to apply to the wrapped function
 * @return {function} a function that wraps the passed function, taking a Shuttle as an input parameter and returning the result of
 * the wrapped function in a Shuttle object
 */
Shuttle.liftFunction = (fn, ...keys) => {
  return async (shuttle) => {
    const args = [];
    // this needs to happen in order, so using a loop instead of .map
    for (let i = 0; i < keys.length; i++) {
      const deepKey = keys[i];
      if (deepKey === null) {
        args.push(null);
      } else {
        let val = null;
        const splitKey = deepKey.split('.');
        for (let j = 0; j < splitKey.length; j++) {
          const key = splitKey[j];
          if (j === 0) {
            if (helpers.exists(shuttle[key])) {
              val = shuttle[key];
            } else {
              // we can't find the property, set the value to null, and don't go through the rest of the loop
              val = null;
              j = splitKey.length;
            }
          } else {
            // So eslint wants this block to be refactored into an else if and an else, but that just makes things totally confusing to read
            // eslint-disable-next-line
            if (helpers.exists(val[key])) {
              val = val[key];
            } else {
              // can't find the nested property. set the value to null, and don't go through the rest of the loop
              val = null;
              j = splitKey.length;
            }
          }
        }
        args.push(val);
      }
    }
    // preserve request and parameter data
    const newShuttle = shuttle;
    const result = await fn(...args);
    newShuttle.data = result;
    return Promise.resolve(newShuttle);
  };
};

/**
 * A pluggable function to print the contents of a shuttle inline
 */
Shuttle.debug = (shuttle) => {
  shuttle.debug();
  return Promise.resolve(shuttle);
};
