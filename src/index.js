import PropTypes from 'prop-types';

const PROP_CHECKED_FLAG = Symbol();
const isObject = input => input === Object(input);

const objectPropType = (obj, refLookup, nakedObj = false) => {
  if (!obj.properties) {
    if (obj.additionalProperties) {
      return PropTypes.objectOf(
        makePropFromDef(false, obj.additionalProperties, refLookup)
      );
    }

    return PropTypes.object;
  }

  const keys = Object.keys(obj.properties);

  if (keys.length === 0) {
    return PropTypes.object;
  }

  const shape = {};

  keys.forEach(key => {
    const objDef = obj.properties[key];
    const isRequired = !!obj.required && obj.required.includes(key);
    const prop = makePropFromDef(isRequired, objDef, refLookup);

    shape[key] = isRequired ? prop.isRequired : prop;
  });

  return nakedObj ? shape : PropTypes.exact(shape);
};

const makePropTypeReference = (isRequired, refName, refLookup) => (
  props,
  propName
) => {
  if (!refLookup) {
    throw Error(`No lookup provided for reference "${refName}"`);
  }

  const ref = refLookup[refName];

  if (!ref) {
    throw Error(`No reference "${refName}" found`);
  }

  const description = Array.isArray(props)
    ? `${refName} (index ${propName} in array)`
    : `${refName} (referenced as "${propName}")`;

  const propValue = props[propName];

  if (propValue == null) {
    if (isRequired) {
      if (propValue === null) {
        throw Error(
          `The prop \`${description}\` is required, but its value is \`null\`.`
        );
      }
      throw Error(
        `The prop \`${description}\` is required, but its value is \`undefined\`.`
      );
    }

    return;
  }

  if (!isObject(propValue)) {
    throw Error(`\`${description}\` can't be a primitive value ("${props}")`);
  }

  // prevent circular recursion

  if (propValue[PROP_CHECKED_FLAG]) {
    return;
  }

  propValue[PROP_CHECKED_FLAG] = true;

  check(ref, propValue, 'prop', description);
  delete propValue[PROP_CHECKED_FLAG];
};

export const makePropFromDef = (isRequired, def, refLookup) => {
  if (def.$ref) {
    const refMatches = def.$ref.match(/#\/definitions\/(.*)/);
    const refName = refMatches[1];

    return makePropTypeReference(isRequired, refName, refLookup);
  }

  if (def.enum) {
    return PropTypes.oneOf(def.enum);
  }

  switch (def.type) {
    case 'array':
      return PropTypes.arrayOf(makePropFromDef(false, def.items, refLookup));

    case 'boolean':
      return PropTypes.bool;

    case 'integer':
    case 'number':
      return PropTypes.number;

    case 'object':
      return objectPropType(def, refLookup);

    case 'string':
      return PropTypes.string;

    default:
      throw Error(`Unknown definition type "${def.type}"`);
  }
};

// -----------------------------------------------------------------------------

export const propFromDef = makePropFromDef.bind(undefined, false);

export const propsFromDefs = defs => {
  const props = {};

  Object.keys(defs).forEach(key => {
    if (defs[key].type === 'object') {
      props[key] = objectPropType(defs[key], props, true);
    } else {
      console.log(`Skipping non-object definition "${key}"`);
    }
  });

  return props;
};

export const check = (...args) => {
  if (!console) {
    throw Error('Cannot track checkPropTypes behaviour without a console');
  }

  const cpt = require('prop-types').checkPropTypes;
  const consoleError = console.error;

  console.error = function(msg) {
    throw Error(msg);
  };

  cpt.apply(undefined, args);
  console.error = consoleError;
};

export const checkExact = (name, specs, values) =>
  check({ [name]: PropTypes.exact(specs) }, { [name]: values }, 'prop', name);
