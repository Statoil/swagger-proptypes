[![Build
Status](https://travis-ci.org/Statoil/swagger-proptypes.svg?branch=master)](https://travis-ci.org/Statoil/swagger-proptypes)

# swagger-proptypes

A simple library to transform Swagger model definitions into [PropType](https://www.npmjs.com/package/prop-types) specifications. You can use this as part of a testing framework.

## Usage

If you have the JSON file from Swagger, you can use `propsFromDefs()` to get an object where each key is the model name, and the value is a the proptype definition:

```js
import { propsFromDefs } from 'swagger-proptypes';

const swaggerJson;  // = {"swagger":"2.0","info": … }
const propTypes = propsFromDefs(swaggerJson.definitions);

// equivalent to:
{
  ModelA: PropTypes.exact({
    propOne: PropTypes.string,
    propTwo: PropTypes.number.isRequired
  }),
  ModelB: PropTypes.exact({
    propThree: PropTypes.bool,
    propFour: PropTypes.oneOf(['a', 'b', 'c'])
  })
}
```

To process a single definition, use `propFromDef()` instead:

```js
import { propFromDef } from 'swagger-proptypes';

const swaggerDef = { type: 'array', items: { type: 'string' } };
const propType = propFromDef(swaggerDef);

// returns this:

PropTypes.arrayOf(PropTypes.string)
```

You can use `request-promise-native` or something like it to retrieve a Swagger JSON file. The definitions within can then be passed to `propsFromDefs()`.

```js
import rpn from 'request-promise-native';
import { defsFromUrl, propsFromDefs } from 'swagger-proptypes';

(async () => {
  const swaggerJson = await rpn('https://petstore.swagger.io/v2/swagger.json', { json: true });
  const propTypes = propsFromDefs(swaggerJson.definitions);
})();
```

To test proptypes without a React component, you can use `checkPropTypes()` in the `prop-types` package. Unfortunately that function does not produce errors; instead logs them to the console. It also only logs once per type of failure, which is not very helpful when trying to test objects systematically.

`swagger-proptypes` comes with the `check()` function, which will throw an error if an object fails proptype checks. It uses the original `checkPropTypes()` behind the scenes, so the validation logic is the same.

```js
import { propFromDef, check } from 'swagger-proptypes';

const swaggerDef = { type: 'array', items: { type: 'string' } };
const propType = propFromDef(swaggerDef);
const anObject = {
  someProperty: ['one', 'two', 'three']
};
const anotherObject = {
  someProperty: ['one', 'two', 3]
};

check({ someProperty: propType }, anObject);  // Will pass
check({ someProperty: propType }, anotherObject);  // Will throw

```

Note that `check()` verifies the validity of the objects's properties; not of the object itself. That is, if there are extraneous properties, they won't fail validation. If you want to throw an error in that case, use the `checkExact()` function instead. You must provide a name for the type of object being tested, so that validation messages make sense.

```js
import { propFromDef, checkExact } from 'swagger-proptypes';

const swaggerDef = { type: 'array', items: { type: 'string' } };
const propType = propFromDef(swaggerDef);

const anObject = {
  someProperty: ['one', 'two']
};
const anotherObject = {
  someProperty: ['one', 'two'],
  extra: true,
};

checkExact('myObjectType', { someProperty: propType }, anObject);  // Will pass
checkExact('myObjectType', { someProperty: propType }, anotherObject);  // Will throw

```
