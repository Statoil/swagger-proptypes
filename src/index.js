import PropTypes from 'prop-types';

const PENDING_REF = Symbol('Pending reference');

const objectPropType = (obj, refLookup, nakedObj = false) => {
  const keys = Object.keys(obj.properties);

  if (keys.length === 0) {
    return PropTypes.object;
  }

  const shape = {};
  const pendingRefs = [];

  keys.forEach(key => {
    const objDef = obj.properties[key];
    const prop = propFromDef(objDef, refLookup);
    const required = !!obj.required && obj.required.includes(key);

    if (prop.valueOf() === PENDING_REF) {
      prop.key = key;
      prop.required = true;
      pendingRefs.push(prop);
    } else {
      shape[key] = required ? prop.isRequired : prop;

      // // Check if there were any pending refs awaiting for this key

      // let pendingRefsIdx = pendingRefs.length;

      // while (pendingRefsIdx--) {
      //   const pendingRef = pendingRefs[pendingRefsIdx];

      //   if (key === pendingRef.refName) {
      //     const refProp = propFromDef(pendingRef.def, refLookup);
      //     shape[pendingRef.key] = pendingRef.required
      //       ? refProp.isRequired
      //       : prop;
      //   }
      //   pendingRefs.splice(pendingRefsIdx, 1);
      // }
    }
  });

  return nakedObj ? shape : PropTypes.exact(shape);
};

// -----------------------------------------------------------------------------

export const propFromDef = (def, refLookup) => {
  if (def.$ref) {
    const refMatches = def.$ref.match(/#\/definitions\/(.*)/);
    const refName = refMatches[1];

    if (!refLookup) {
      throw Error(`Cannot find definition for reference "${refName}"`);
    }

    const ref = refLookup[refName];

    if (ref === undefined) {
      // ref = Object(PENDING_REF);
      // ref.refName = refName;
      // ref.def = def;

      return () => refLookup[refName];
    }

    return ref;
  }

  if (def.enum) {
    return PropTypes.oneOf(def.enum);
  }

  switch (def.type) {
    case 'array':
      console.log('will check array of', def.items);
      return PropTypes.arrayOf(
        (propValue, key, componentName, location, propFullName) => {
          const item = propValue[key];
          const name = `arrayOf(${refLookup})`;
          PropTypes.checkPropTypes(
            { [name]: propFromDef(def.items, refLookup) },
            { [name]: item },
            propFullName,
            componentName
          );
        }
      );

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

export const propsFromDefs = defs => {
  const props = {};

  // TODO: we must process defs that have references only after those
  // references are created

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

  console.error = msg => {
    throw Error(msg);
  };

  cpt.apply(undefined, args);
  console.error = consoleError;
};

export const checkExact = (name, specs, values) =>
  check({ [name]: PropTypes.exact(specs) }, { [name]: values }, 'prop', name);
