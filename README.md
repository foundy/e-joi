# e-joi
[![Build Status](https://travis-ci.org/foundy/e-joi.svg?branch=master)](https://travis-ci.org/foundy/e-joi)

Joi middleware for express

# Getting Started

`$ npm install e-joi`

# Usage

```javascript
const Joi = require('joi');
const eJoi = require('e-joi');

const schema = {
  headers: Joi.object().keys({
    'user-agent': Joi.string(),
  }),
};

app.get('/foo', eJoi(schema), (req, res) => res.send('enjoy!'));
```

# API

* `eJoi(schema[, callback])`
* `eJoi(schema, options[, callback])`

```javascript
// Joi validate options
const options = { convert: false };

app.get('/foo', eJoi(schema, options), (req, res) => res.send('enjoy!'));

// callback handling with eJoi options
const callback = eJoi.callback({ nextRoute: true });

app.get('/foo', eJoi(schema, options, callback), (req, res) => res.send('enjoy!'));

// custom callback handling
const customCallback = (req, res, next, result) => next();

app.get('/foo', eJoi(schema, options, customCallback), (req, res) => res.send('enjoy!'));
```

## Options (for handling eJoi.callback)

* `nextRoute`: when `true`, pass control to the next route. Defaults to `false`.
* `override`: override the defined request properties. Defaults to `true`.
  * when `true`, Override the properties.
  * when `false`, Not override.
  * when `array`, Override the properties of the array element.
  * when `string`, Override the properties of the string.

```javascript
// next route
const callback = eJoi.callback({ nextRoute: true });

// response 'enjoy!'
app.post('/foo', eJoi(schema, callback), (req, res) => res.send('sad..'));
app.post('/foo', eJoi(schema, callback), (req, res) => res.send('enjoy!'));
```

```javascript
// override `false`
const callback = eJoi.callback({ override: false });
// override headers and params
const callback = eJoi.callback({ override: ['headers', 'params'] });
// override body
const callback = eJoi.callback({ override: 'body' });
```

## Custom callback

### `fn(req, res, next, result)`

> This function returns a Promise-like object that can be used as a promise, or as a simple object like.
>
> Please refer to the [Joi API Reference](https://github.com/hapijs/joi/blob/v13.0.1/API.md#validatevalue-schema-options-callback)

```javascript
const myCallback = (req, res, next, result) => {
  const { error, value } = result;

  if (error) {
    return next(error);
  }

  // do something using value...

  next();
};

// or

const myCallback = (req, res, next, promise) => {
  promise
    .then(value => next()) // do something using value...
    .catch(error => next(error));
};

// route example
app.post('/foo', eJoi(schema, myCallback), (req, res) => res.send('enjoy!'));
```
