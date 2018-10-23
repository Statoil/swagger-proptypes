import PropTypes from 'prop-types';
import Swagger from 'swagger-client';

const objectPropType = (obj, refBase, nakedObj = false) => {
  const keys = Object.keys(obj.properties);

  if (keys.length === 0) {
    return PropTypes.object;
  }

  const shape = {};

  keys.forEach(key => {
    const objDef = obj.properties[key];
    const prop = propFromDef(objDef, refBase);
    const required = !!obj.required && obj.required.includes(key);

    shape[key] = required ? prop.isRequired : prop;
  });

  return nakedObj ? shape : PropTypes.exact(shape);
};

// -----------------------------------------------------------------------------

export const propFromDef = (def, refBase) => {
  if (def.$ref) {
    const refMatches = def.$ref.match(/#\/definitions\/(.*)/);
    const ref = refBase[refMatches[1]];
    if (ref === undefined) {
      throw Error(`Cannot find definition for reference "${refMatches[1]}"`);
    }
    return refBase[refMatches[1]];
  }

  if (def.enum) {
    return PropTypes.oneOf(def.enum);
  }

  switch (def.type) {
    case 'array':
      return PropTypes.arrayOf(propFromDef(def.items, refBase));

    case 'boolean':
      return PropTypes.bool;

    case 'integer':
    case 'number':
      return PropTypes.number;

    case 'object':
      return objectPropType(def, refBase);

    case 'string':
      return PropTypes.string;

    default:
      throw Error(`Unknown definition type "${def.type}"`);
  }
};

export const propsFromDefs = defs => {
  const props = {};

  // TODO: we must process defs that have references only after those
  // references are created

  Object.keys(defs).forEach(
    // key => (props[key] = propFromDef(defs[key], props))
    key => (props[key] = objectPropType(defs[key], props, true))
  );

  return props;
};

export const defsFromUrl = async url => {
  const response = await Swagger.http({ url });
  return response.body.definitions;
};

export const check = (...args) => {
  if (!console) {
    throw Error('Cannot track checkPropTypes behaviour without a console');
  }

  const cpt = require('prop-types').checkPropTypes;
  const consoleError = console.error;

  console.error = msg => {
    throw Error(msg);
  };

  cpt.apply(undefined, args);
  console.error = consoleError;
};
