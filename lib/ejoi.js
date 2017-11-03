'use strict';

const Joi = require('joi');

exports = module.exports = eJoi;
exports.errorsHandler = errorsHandler; // 정형화된 error 객체를 만들기 위한 편의성을 고려한다. ex) app.use(errorsHandler);
exports.reach = reach; // 뭔가 활용도가 있을거 같기에.. 일단 달아놓자.

/**
 * Validation middleware using Joi
 *
 * @param {Object} schema
 * @param {Object} [options] Joi 옵션으로 사용할지, eJoi 옵션으로 사용할지, 아니면 같이 사용할지(이건 좀 별로인데..)
 * @param {Function} [callback] promise 객체를 반환하기 위한 callback
 * @returns {Function} middleware
 * @todo schema의 headers, body, params 등에 override하는 부분을 어디에 넣을지 고민이다..
 *       schema의 meta를 활용한다면 { eJoi: true, override: true } 같은 형태를 생각중..
 *       schema를 오염시키는 부분이라면 options 파라미터를 어찌 처리할지 고민해야 한다..
 */
function eJoi(schema, options, callback) {
  const compiled = _compile(schema);
  const opts = {}; // extend된 옵션이 나올 경우로 일단 표기 Object.assign({}, defaults, options);

  return (req, res, next) => {

    const result = Joi.validate(req, schema, options);

    if (callback) { return callback(req, res, next, result); }

    result
      .then(value => opts.nextRoute ? next('route') : next())
      .catch(error => next(error));
  };
}

// headers, body 등을 포함하는 부분에 컴파일이 필요할지는 모르겠다.
function _compile(schema) {
  try {
    return schema.isJoi ? schema : Joi.compile(schema);
  } catch (err) {
    throw err;
  }
}

// 아래 형태로 예시를 달아본다.
const schema = {
  headers: Joi.object().keys({ foo: Joi.string() }),
};
const options = {
  convert: true,
  allowUnknown: true,
};
const customCallback = (req, res, next, promise) => {
  // ex1
  promise.then(value => next()).catch(error => next(error));
  // ex2
  promise.then(value => res.send(JSON.stringify(value))).catch(error => next(error));
};

// 대략 이런 모양
router.get('/', eJoi(schema), (req, res) => res.send('Do it!'));
router.get('/', eJoi(schema, options), (req, res) => res.send('Do it!'));
router.get('/', eJoi(schema, options, customCallback));
router.get('/', eJoi(schema, options, customCallback), (req, res) => res.send('Do it!'));