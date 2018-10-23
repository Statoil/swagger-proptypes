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

There is also `defsFromUrl()`, a small convenience function to fetch a Swagger JSON file and retrieve the definitions, which can be passed to `propsFromDefs()`.

```js
import { defsFromUrl, propsFromDefs } from 'swagger-proptypes';

(async () => {
  const swaggerDefs = await defsFromUrl('https://petstore.swagger.io/v2/swagger.json');
  const propTypes = propsFromDefs(swaggerDefs);
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
