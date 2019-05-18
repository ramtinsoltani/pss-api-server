# TypeScript Server Infrastructure/Template

This repository contains a Node.js server infrastructure/template ready for use with the following properties:

  - TypeScript enabled
  - Powered by Express
  - Automatic code minification
  - Logic is encapsulated into "Services" and router middlewares are grouped as "Routers"
  - Routes are easily defined inside the Router decorator
  - Super easy input validation on routers (body input, headers, query parameters, etc.)
  - Ability to extend the validation logic with custom validators
  - Dynamic route and service installation
  - Dynamic service injection without circular dependency issues
  - TypeDoc ready

The purpose of this repository is mainly reusability and a kick start to developing backend solutions with TypeScript.

# Installation

  1. Clone this repo
  2. `npm install`
  3. That's it!

# NPM Scripts

  - `npm run build`: Build the server into `dist`.
  - `npm run launch`: Runs the last build.
  - `npm run start`: Builds and runs the server.
  - `npm run docs`: Builds the internal documentation.

# Development

All the components of this server infrastructure are divided into two categories: Services and Routers.

## Services

A service is basically a singleton class which is shared and accessible throughout the whole app (really similar to Angular singleton/global services).

To build a service, simply create a file with the extension `.service.ts` anywhere inside the `src` directory and decorate it using the `@Service` decorator as shown below:

```ts
// all imports are from src/core.ts
import { Service } from './core';

@Service({
  name: 'foo'
})
export class FooService {

  log() {
    console.log('Foo service!');
  }

}
```

This file will be automatically picked up by the server, so there's no need for any installation. You can then inject these services into your routers and also into other services, as shown below:

```ts
import { Service, OnInjection } from './core';
import { FooService } from './foo.service'; // For typings

@Service({
  name: 'bar'
})
export class BarService implements OnInjection {

  private foo: FooService;

  // Inject the service
  onInjection(services: any) {
    this.foo = services.foo;
    this.foo.log(); // Logs: Foo service!
  }

}
```

## Routers

Similar to services, you can build a router by creating a file with the extension `.router.ts` stored anywhere inside the `src` directory. The `@Router` decorator is then used to decorate the class as a router while providing route definitions and other metadata.

```ts
import { Router, OnInjection } from './core';
import { BarService } from './bar.service';

@Router({
  name: 'router1'
})
export class Router1 implements OnInjection {

  private bar: BarService;

  onInjection(services: any) {
    this.bar = services.bar;
  }

}
```

### Defining Routes

The `@Router` decorator accepts the following properties:

| Key | Type | Description |
|:----|:----:|:------------|
| name | string | The name of the router (only used for logging). |
| priority | number | Routers are sorted by priority before mounting their middleware in the Express stack (defaults to `0`). |
| routes | RouteDefinition[] | An array of route definitions. |

The `RouteDefinition` interface is as follows:

| Key | Type | Required | Description |
|:----|:----:|:--------:|:------------|
| path | string | Yes | The path of the route (identical to app.use(**path**)). |
| handler | string | Yes | The name of the route handler function (must exist in the router class). |
| method | RouteMethod | No | The HTTP method of the route. If not provided, the route will cover all methods (global). |
| validate | ValidationRule[] | No | Used to easily install validators for validating input (body, header, etc.) |

The following is an example of a simple router which defines the route `GET /test` linked to the `Router1.routeHandler1` route handler:

```ts
import { Router, RouteMethod } from './core';
import { Request, Response, NextFunction } from 'express';

@Router({
  name: 'router1',
  routes: [
    { path: '/test', method: RouteMethod.GET, handler: 'routeHandler1' }
  ]
})
export class Router1 {

  routeHandler1(req: Request, res: Response) {
    res.status(200).send('OK');
  }

}
```

### Input Validation

There are four types of validation in routers: Headers, Query Parameters, Body (only JSON and urlencoded), and custom validation:

  1. `header({ name: value, ... })`: With header validation you can check if headers are present and set with the required value.
  2. `query(['paramName', ...])`: The query parameters validator can only check the presence of the query input.
  3. `body({ key: ValidatorFunction })`: Body validators can create complex validation with ease by combining different logic on each key validation.
  4. `custom(ValidatorFunction)`: If none of the above fit your needs, you can always take control!

> Note: You can stack multiple validators of the same kind inside the `validate` array.

When validation is used, the requests that won't pass the validation will automatically get rejected with a validation error.

#### Header Validation Example

```ts
import { Router, RouteMethod, header } from './core';

@Router({
  name: 'router1',
  priority: 100,
  routes: [
    { path: '/postdata', handler: 'postHandler', method: RouteMethod.POST, validate: [
      header({ 'content-type': 'application/json' })
    ]}
  ]
})
export class Router1 {

  postHandler(req, res) {

    // req.body is ensured to be valid JSON

  }

}
```

#### Query Parameter Validation Example

```ts
import { Router, query } from './core';

@Router({
  name: 'router1',
  priority: 100,
  routes: [
    { path: '*', handler: 'authHandler', validate: [
      query(['token'])
    ]}
  ]
})
export class Router1 {

  authHandler(req, res) {

    // req.query.token is definitely provided

  }

}
```

#### Body Validation Example

Now let's get crazy! Let's write a validator which requires the following JSON body:

| Key | Requirement |
|:----|:------------|
| title | Must be present and a valid string. |
| authors | Must be present and a valid array of strings with at least one entry. |
| co-authors | Optional, but if present, it has the same requirement as `authors` but all entries must be prefixed with `co-`! |
| release | A namespace. |
| release.year | Must be a valid number between `2000` and `2019`. |
| release.sells | Must be a valid number. |
| price | Cannot be a boolean. |

```ts
import {
  Router,
  RouteMethod,
  body,
  type,
  len,
  opt,
  and,
  match,
  not
} from './core';

@Router({
  name: 'router1',
  priority: 100,
  routes: [
    { path: '/book/new', handler: 'newBook', method: RouteMethod.POST, validate: [
      body({
        title: type.string,
        authors: type.array(type.string, len.min(1)),
        'co-authors': opt(type.array(and(type.string, match(/^co-.+$/))), len.min(1)),
        release: {
          year: and(type.number, range(2000, 2019)),
          sells: type.number
        },
        price: not(type.boolean)
      })
    ]}
  ]
})
export class Router1 {

  newBook(req, res) {

    // req.body has passed the validation test

  }

}
```

#### Body Validation: Enums

Properties of the body object can be checked against any enums (including string enums) using the `type.ofenum` validator:

```ts
import {
  Router,
  RouteMethod,
  body,
  type
} from './core';

enum Category {
  Category1,
  Category2
}

@Router({
  name: 'router1',
  priority: 100,
  routes: [
    { path: '/test', handler: 'testHandler', method: RouteMethod.POST, validate: [
      body({
        category: type.ofenum(Category)
      })
    ]}
  ]
})
export class Router1 {

  testHandler(req, res) {

    // req.body has passed the validation test

  }

}
```

#### Body Validation: Arrays Of Objects

An array of objects can be validated using the `sub` validator. It takes a body validator object (the same object the `body` function takes except there can be no nested objects) and validates all the items inside the array against it:

```ts
import {
  Router,
  RouteMethod,
  body,
  type,
  sub,
  len
} from './core';

@Router({
  name: 'router1',
  priority: 100,
  routes: [
    { path: '/test', handler: 'testHandler', method: RouteMethod.POST, validate: [
      body({
        authors: type.array(sub({
          firstName: type.string,
          lastName: type.string
        }), len.min(1))
      })
    ]}
  ]
})
export class Router1 {

  testHandler(req, res) {

    // req.body has passed the validation test

  }

}
```

#### Body Validation API

Here's an in-depth documentation on all the built-in body validator functions:

| Validator | Signature | Description |
|:----------|:----------|:------------|
| type.string | NA | Checks if the value is a valid string. |
| type.number | NA | Checks if the value is a valid number. |
| type.boolean | NA | Checks if the value is a valid boolean. |
| type.nil | NA | Checks if the value is null. |
| type.array | type.array(_[validator, arrayValidator]_) | Checks if the value is a valid array. If the validator is provided, it also validates each item of the array against it, if the arrayValidator is provided, the array itself is validated against it (useful for enforcing length restrictions on the array). |
| type.ofenum | type.ofenum(enumerator) | Checks if the value is included in the given enumerator.|
| equal | equal(val) | Checks if the body value is equal to the given value. |
| or | or(...validators) | ORs all given validators. |
| and | and(...validators) | ANDs all given validators. |
| not | not(validator) | Negates the given validator. |
| opt | opt(validator) | Applies the given validator only if the value is present (makes the value optional). |
| match | match(regex) | Validates the value against the given regular expression (without string type check). |
| num.min | num.min(val) | Checks if the value is greater than or equal to the given number. |
| num.max | num.max(val) | Checks if the value is less than or equal to the given number. |
| num.range | num.range(min, max) | Checks if the value is between the given range (inclusive). |
| len.min | len.min(val) | Checks if the length of the value is greater than or equal to the given number. |
| len.max | len.max(val) | Checks if the length of the value is less than or equal to the given number. |
| len.range | len.range(min, max) | Checks if the length of the value is between the given range (inclusive). |
| sub | sub(bodyValidator) | Validates an object against the given flat body validator (useful for validating arrays of objects). |

#### Custom Body Validation

If you need to perform a more complex body validation, you can always create a validator function or factory that takes arguments and returns a validator function. Below is an example of a custom body validator which validates the property `oddOnly` on the body using a validator function and `evenOnly` using a validator factory:

```ts
import {
  Router,
  RouteMethod,
  body,
  type,
  ValidatorFunction
} from './core';

@Router({
  name: 'router1',
  priority: 100,
  routes: [
    { path: '/test', handler: 'testHandler', method: RouteMethod.POST, validate: [
      body({
        oddOnly: odd,
        evenOnly: parity(false)
      })
    ]}
  ]
})
export class Router1 {

  testHandler(req, res) {

    // req.body has passed the validation test

  }

}

function odd(value: any): boolean {

  // Reusing type.number validator function
  return type.number(value) && (value % 2 === 1);

}

function parity(odd: boolean): ValidatorFunction {

  return (value: any): boolean => {

    return type.number(value) && (value % 2 === (odd ? 1 : 0));

  };

}
```

#### Custom Validation

If you need to do something more complex or unique and still want to benefit from reusability and the auto-respond feature of the validators, you can create a function with this signature `(req: Request) => boolean` and pass it to the `custom` method:

```ts
import { Router, RouteMethod, custom } from './core';
import { Request } from 'express';

@Router({
  name: 'auth',
  priority: 100,
  routes: [
    { path: '*', handler: 'authHandler', validate: [
      custom(basicAuthValidator)
    ]}
  ]
})
export class Router1 {

  authHandler(req, res, next) {

    // Do basic auth
    next();

  }

}

// Making sure basic authentication credentials are provided
function basicAuthValidator(req: Request): boolean {

  const authorization = req.header('Authorization');

  return authorization && authorization.substr(0, 5) === 'Basic';

}
```

## Server Config

The server has a configuration file located at `src/config.json` with the following settings:

| Key | Type | Description |
|:----|:----:|:------------|
| port | number | The port number to launch the server on (defaults to `5000`). |
| verboseLogs | boolean | Shows startup logs and route-specific logs (defaults to `true`). |
| predictive404 | boolean | If true, installs a 404 handler at the top of the stack instead (this can be configured through `predictive404Priority`), which predicts if path will match with any middleware in the stack and rejects the request with a 404 error if not. This is useful as requests that will eventually result in a 404 error won't go through the stack in the first place. Please note that the prediction ignores all `*` and `/` routes (defaults to `false`). |
| predictive404Priority | number | The priority of the predictive 404 middleware (defaults to `Infinity`). |

### Config Expansion

You can expand the config object typing by editing the `ServerConfig` model inside `src/config.model.ts`.

### Config Injection

If you need to get access to the config object inside your services or routers, implement `OnConfig` on your classes and define the following function:

```ts
import { OnConfig, ServerConfig } from './core';

class implements OnConfig {

  onConfig(config: ServerConfig) {
    // Inject or use...
  }

}
```

## Server Assets

Assets can be declared inside `package.json` using the `assets` array. Any files inside the array will be copied to the `dist` folder after the server build. Keep in mind that all paths should be relative to the `src` directory.

### Assets Example

```json
{
  "name": "ts-server",
  ...
  "assets": [
    "firebase.certificate.json"
  ]
}
```

## Server Error

The `ServerError` class is available for responding to users with errors through the REST API and is used by the server internally when rejecting requests (e.g. validation errors, internal errors, 404 errors, etc.). Use the following example as how to interact with the `ServerError` class:

```ts
import { ServerError } from './core';

const error = new ServerError('Message', 'ERROR_CODE'); // Code defaults to 'UNKNOWN_ERROR' when not provided

// res.json(error) --> { error: true, message: 'Message', code: 'ERROR_CODE' }
```

> Note that this class is not an actual extension of the Error class and should not be used when stack trace is needed.

# Notes

  - You can see some more detailed examples inside the sample files in `services` and `routers` directories.
  - The directory structure of the server is totally up to you, since the server scans the `src` for `.service.js` and `.router.js` files to install at any depth.
  - You can make your validators modular by storing the validator functions and the validator body definitions inside other files and reuse them everywhere.
