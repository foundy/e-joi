const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const { expect } = require('chai');
const Joi = require('joi');
const eJoi = require('./');

describe('eJoi', () => {

  it('should throw an exception if without arguments.', done => {
    expect(() => eJoi()).to.throw('Invalid schema object');

    done();
  });

  describe('compile', () => {

    it('should return a 500 status and Joi validation error.', done => {
      const schema = { headers: { city: 'seoul' } };
      const app = express();

      app.get('/foo', eJoi(schema, { allowUnknown: true }), (req, res) => res.send('enjoy'));

      app.use((err, req, res, next) => res.json(err));

      request(app)
        .get('/foo')
        .set({ city: 'bangkok' })
        .end((err, res) => {
          expect(res.body.isJoi).to.equal(true);
          expect(res.body.name).to.equal('ValidationError');
          done();
        });
    });

    it('should return a 200 status and `enjoy` string.', done => {
      const schema = { headers: { city: 'seoul' } };
      const app = express();

      app.get('/foo', eJoi(schema, { allowUnknown: true }), (req, res) => res.send('enjoy'));

      request(app)
        .get('/foo')
        .set({ city: 'seoul' })
        .expect(200, 'enjoy', done);
    });

  });

  describe('Pass only the schema', () => {

    it('should respond with 200 status and `enjoy`.', done => {
      const schema = { body: Joi.any() };
      const app = express();

      app.get('/foo', eJoi(schema), (req, res) => res.send('enjoy'));

      request(app)
        .get('/foo')
        .expect(200, 'enjoy', done);
    });

  });

  describe('Passing schema and options', () => {

    it('should respond with 200 status and `enjoy` by allowing the allowUnknown option.', done => {
      const schema = Joi.object().keys({
        headers: Joi.object().keys({
          city: Joi.string().valid('seoul').required(),
        }),
      });
      const app = express();

      app.get('/foo', eJoi(schema, { allowUnknown: true }), (req, res) => res.send('enjoy'));

      request(app)
        .get('/foo')
        .set('city', 'seoul')
        .expect(200, 'enjoy', done);
    });

    it('should respond with a type error by disabling the convert option.', done => {
      const schema = Joi.object().keys({
        headers: Joi.object().keys({
          cities: Joi.object(),
        }).options({ allowUnknown: true }),
      });
      const app = express();

      app.get('/foo', eJoi(schema, { convert: false }), (req, res) => res.send('enjoy'));

      app.use((err, req, res, next) => res.status(500).send(err.message));

      request(app)
        .get('/foo')
        .set('cities', JSON.stringify({ korea: 'seoul' }))
        .expect(500)
        .end((err, res) => {
          expect(res.text).to.equal('child "headers" fails because [child "cities" fails because ["cities" must be an object]]');
          done();
        });
    });

  });

  describe('Schema passing and eJoi callback handling', () => {

    describe('override option', () => {

      it('should not be overridden.', done => {
        const schema = Joi.object().keys({
          headers: Joi.object().keys({
            cities: Joi.object(),
          }).options({ allowUnknown: true }),
        });
        const eJoiMiddleware = eJoi(schema, eJoi.callback({ override: false }));
        const app = express();

        app.get('/foo', eJoiMiddleware, (req, res) => res.json({ cities: req.get('cities') }));

        request(app)
          .get('/foo')
          .set('cities', JSON.stringify({ korea: 'seoul', thailand: 'bangkok' }))
          .expect(200, { cities: '{"korea":"seoul","thailand":"bangkok"}' }, done);
      });

      it('should only override the properties selected by the array.', done => {
        const schema = Joi.object().keys({
          headers: Joi.object().keys({
            cities: Joi.object(),
          }).options({ allowUnknown: true }),
          params: Joi.object().keys({
            id: Joi.string().default('bar'),
          }).options({ allowUnknown: true }),
        });
        const eJoiMiddleware = eJoi(schema, eJoi.callback({ override: ['params'] }));
        const app = express();

        app.get('/foo/:id?', eJoiMiddleware, (req, res) => res.json({
          headers: { cities: req.get('cities') },
          params: req.params,
        }));

        request(app)
          .get('/foo')
          .set('cities', JSON.stringify({ korea: 'seoul', thailand: 'bangkok' }))
          .expect(200, {
            headers: { cities: '{"korea":"seoul","thailand":"bangkok"}' },
            params: { id: 'bar' },
          }, done);
      });

      it('should override only one property selected by the string.', done => {
        const schema = Joi.object().keys({
          headers: Joi.object().keys({
            cities: Joi.object(),
          }).options({ allowUnknown: true }),
          params: Joi.object().keys({
            id: Joi.string().default('bar'),
          }).options({ allowUnknown: true }),
        });
        const eJoiMiddleware = eJoi(schema, { allowUnknown: true }, eJoi.callback({ override: 'headers' }));
        const app = express();

        app.get('/foo/:id?', eJoiMiddleware, (req, res) => res.json({
          headers: { cities: req.get('cities') },
          params: req.params,
        }));

        request(app)
          .get('/foo')
          .set('cities', JSON.stringify({ korea: 'seoul', thailand: 'bangkok' }))
          .expect(200, {
            headers: { cities: { korea: 'seoul', thailand: 'bangkok'} },
            params: {},
          }, done);
      });

      it('should be override the entire property.', done => {
        const schema = Joi.object().keys({
          headers: Joi.object().keys({
            cities: Joi.object(),
          }),
          params: Joi.object().keys({
            id: Joi.string().default('bar'),
          }),
          query: Joi.object({
            q: Joi.string().default('myquery'),
          }),
          body: Joi.any(),
        });
        const eJoiMiddleware = eJoi(schema, { allowUnknown: true }, eJoi.callback({ override: true }));
        const app = express();

        app.use(bodyParser.json());

        app.post('/foo/:id?', eJoiMiddleware, (req, res, next) => {
          console.log('body', req.body);
          next();
        }, (req, res) => res.json({
          headers: { cities: req.get('cities') },
          body: req.body,
          params: req.params,
          query: req.query,
        }));

        request(app)
          .post('/foo/foundy')
          .set('cities', JSON.stringify({ korea: 'seoul', thailand: 'bangkok' }))
          .send({ play: 'node' })
          .expect(200, {
            headers: { cities: { korea: 'seoul', thailand: 'bangkok'} },
            body: { play: 'node' },
            params: { id: 'foundy' },
            query: { q: 'myquery' },
          }, done);
      });

    });

    it('should pass through the middleware and then move to the next route.', done => {
      const schema = Joi.object().keys({
        headers: Joi.any(),
      });
      const eJoiMiddleware = eJoi(schema, eJoi.callback({ nextRoute: true }));
      const app = express();

      app.get('/foo', eJoiMiddleware, (req, res) => res.send('current'));
      app.get('/foo', (req, res) => res.send('next route'));

      request(app)
        .get('/foo')
        .expect(200, 'next route', done);
    });

  });

  describe('Use custom callback', () => {

    it('should return a 415 `Unsupported Media Type` error.', done => {
      const schema = Joi.object().keys({
        headers: Joi.object().keys({
          'content-type': Joi.string().valid('application/json').required(),
        }),
      });
      const customCallback = (req, res, next, promise) => {
        promise
          .then(value => next())
          .catch(error => res.status(415).end());
      };
      const app = express();

      app.get('/foo', eJoi(schema, { allowUnknown: true }, customCallback), (req, res) => res.send('enjoy'));

      request(app)
        .get('/foo')
        .set('Content-Type', 'application/xml')
        .expect(415, done);
    });

  });

});
