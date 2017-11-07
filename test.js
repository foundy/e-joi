const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const Joi = require('joi');
const eJoi = require('./');

describe('arguments check', () => {

  // describe('no arguments', () => {
  //   it('should return an error', done => done());
  //   it('should return an error if no schema', done => done());
  // });

  describe('schema', () => {
    it('should assert the response text', done => {
      const app = express();
      const schema = {
        body: Joi.any(),
      };

      app.get('/foo', eJoi(schema), (req, res) => res.send('enjoy'));

      request(app)
        .get('/foo')
        .expect(200, 'enjoy', done);
    });
  });

  describe('schema, options', () => {
    it('should assert the response text', done => {
      const app = express();
      const schema = {
        body: Joi.any(),
      };

      app.get('/foo', eJoi(schema, { convert: true }), (req, res) => res.send('enjoy'));

      request(app)
        .get('/foo')
        .expect(200, 'enjoy', done);
    });
  });

  describe('schema, callback', () => {
    it('should assert the response body', done => {
      const app = express();

      app.use(bodyParser.json());

      const schema = {
        body: Joi.any(),
      };

      app.post('/foo', eJoi(schema, (req, res, next, result) => {
        result
          .then(value => res.json(value.body))
          .catch(error => next(error));
      }));

      request(app)
        .post('/foo')
        .send({ foo: 'bar' })
        .expect(200, { foo: 'bar' }, done);
    });
  });

  describe('schema, options, callback', () => {
    it('should assert the response text via second route', done => {
      const app = express();
      const schema = {
        body: Joi.any(),
      };

      app.get('/foo', eJoi(schema, { convert: true }, eJoi.callback({ nextRoute: true })), (req, res) => res.send('enjoy'));
      app.get('/foo', (req, res) => res.send('response from next route'));

      request(app)
        .get('/foo')
        .expect(200, 'response from next route', done);
    });
  });

  // describe('performance', () => {
  //   it('request performance test - stripUnknown', done => {
  //     const app = express();
  //     const stripSchema = Joi.object({
  //       headers: Joi.any(),
  //       body: Joi.any(),
  //       params: Joi.any(),
  //       query: Joi.any(),
  //     });
  //     const schema = Joi.object({
  //       body: Joi.any(),
  //     });

  //     app.get('/foo', (req, res, next) => {
  //       console.time('stripUnknown');
  //       const stripReq = Joi.validate(req, stripSchema, { stripUnknown: true });

  //       Joi.validate(stripReq, schema, (err, value) => {
  //         console.timeEnd('stripUnknown');
  //         next();
  //       });
  //     }, (req, res) => res.send('enjoy'));

  //     request(app)
  //       .get('/foo')
  //       .expect(200, 'enjoy', done);
  //   });

  //   it('request performance test - custom', done => {
  //     const app = express();
  //     const schema = Joi.object({
  //       body: Joi.any(),
  //     });

  //     app.get('/foo', (req, res, next) => {
  //       console.time('custom');
  //       const stripReq = {};

  //       ['headers', 'body', 'params', 'query'].reduce((obj, val) => {
  //         obj[val] = req[val];
  //         return obj;
  //       }, stripReq);

  //       Joi.validate(stripReq, schema, (err, value) => {
  //         console.timeEnd('custom');
  //         next();
  //       });
  //     }, (req, res) => res.send('enjoy'));

  //     request(app)
  //       .get('/foo')
  //       .expect(200, 'enjoy', done);
  //   });

  // });

});
