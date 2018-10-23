# swagger-proptypes

A simple library to transform Swagger model definitions into [PropType](https://www.npmjs.com/package/prop-types) specifications. You can use this as part of a testing framework.

## Usage

If you have the JSON file from Swagger, you can use `propsFromDefs` to get an object where each key is the model name, and the value is a **string representation** of the proptype definition:

```js
import 'fs';
import { propsFromDefs } from 'swagger-proptypes';

const swaggerJson;  // = {"swagger":"2.0","info": … }
const propTypes = propsFromDefs(swaggerJson.definitions);

// output (note the strings):
{
  ModelA: `PropTypes.exact({
    "propOne": PropTypes.string,
    "propTwo": $PropTypes.number.isRequired
  })`,
  ModelB: `PropTypes.exact({
    "propThree": PropTypes.bool,
    "propFour": PropTypes.oneOf(["a","b","c"])
  })`
}
```

You can also pass the Swagger definitions to `moduleFromDefs()`, which will return a string with a full JavaScript module, suitable to write to a file.

There is also `defsFromUrl()`, a small convenience function to fetch a Swagger JSON file and retrieve the definitions, which can be passed to `propsFromDefs()` or `moduleFromDefs()`.

```js
import 'fs';
import { defsFromUrl, moduleFromDefs } from 'swagger-proptypes';

(async () => {
  const swaggerDefs = await defsFromUrl('https://petstore.swagger.io/v2/swagger.json');
  fs.writeFileSync('petstore-proptypes.js', moduleFromDefs(swaggerDefs));
})();
```
