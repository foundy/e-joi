const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const Joi = require('joi');
const eJoi = require('../');

describe('eJoi', () => {

  describe('next middleware', () => {
    const app = express();

    app.use(bodyParser.json());

    const schema = {
      body: Joi.object().meta({ eJoi: true, override: true }),
    };

    app.post('/:id', eJoi(schema, { nextRoute: false }), (req, res) => res.send('first'));
    app.post('/:id', eJoi(schema), (req, res) => res.send('second'));

    // promise all
    // app.post('/:id', eJoi([schema, schema, schema]), (req, res) => res.send('second'));

    // eJoi options
    // app.post('/:id', eJoi(schema), (req, res) => res.send('second'));

    it('success next route', done => {
      request(app)
        .post('/next')
        .send({ city: 'korea' })
        .expect('first', done);
    });
  });

});
