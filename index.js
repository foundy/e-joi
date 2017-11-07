'use strict';

const Joi = require('joi');

exports = module.exports = eJoi;
exports.callback = validateCallback;

/**
 * Default options for validateCallback
 *
 * @type {Object}
 * @property {boolean} useNextRoute Pass control to the next route. (Only if the validation is successful)
 * @property {boolean|string|Array} override Specify the target property to override according to type
 */
const defaults = {
  nextRoute: false,
  override: true,
};

/**
 * Validation middleware using Joi
 *
 * @public
 * @param {Object|Object[]} schema Joi type object or plain object
 * @param {Object} [options={}] Joi validate options
 * @param {Function} [callback=validateCallback()] validation callback
 * @returns {Function} middleware
 */
function eJoi(schema, options = {}, callback = validateCallback()) {
  const compiled = compile(schema);
  const props = Object.keys(compiled.describe().children);

  // eJoi(schema, callback)
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  return (req, res, next) => {
    const stripUnknownRequest = stripUnknownProperties(req, props);

    const result = Joi.validate(stripUnknownRequest, compiled, options);

    callback(req, res, next, result);
  };
}

/**
 * It is a callback that performs validation
 *
 * @public
 * @param {Object} [options={}] options for handling callback
 * @returns {Function} validation callback
 */
function validateCallback(options = {}) {
  const opts = Object.assign({}, defaults, options);

  return (req, res, next, promise) => {
    promise
      .then(value => {
        if (opts.override) {
          Object.assign(req, value);
        }

        if (opts.nextRoute) {
          return next('route');
        }

        next();
      })
      .catch(error => next(error));
  };
}

/**
 * Joi compile
 *
 * @private
 * @param {Object} schema Joi type object or plain object
 * @returns {Object} Joi schema object
 */
function compile(schema) {
  try {
    return schema.isJoi ? schema : Joi.compile(schema);
  } catch (err) {
    throw err;
  }
}

/**
 * Extract the request properties
 *
 * @private
 * @param {Object} req express request object
 * @param {Array} props request object properties
 * @returns {Object} request reference object
 */
function stripUnknownProperties(req, props) {
  return props.reduce((obj, prop) => {
    obj[prop] = req[prop];
    return obj;
  }, {});
}
