import Swagger from 'swagger-client';

const PT_PREFIX = 'PropTypes';

const stringify = data => JSON.stringify(data);

const prefix = prop => `${PT_PREFIX}.${prop}`;

const objectPropType = (obj, refBase = '') => {
  const keys = Object.keys(obj.properties);

  if (keys.length === 0) {
    return 'object';
  }

  const props = keys.map(key => {
    const objDef = obj.properties[key];
    const required =
      obj.required && obj.required.includes(key) ? '.isRequired' : '';

    return `  ${stringify(key)}: ${propFromDef(objDef, refBase)}${required}`;
  });

  return prefix('exact({\n') + props.join(',\n') + '\n})';
};

// -----------------------------------------------------------------------------

export const propFromDef = (def, refBase = '') => {
  if (def.$ref) {
    const refMatches = def.$ref.match(/#\/definitions\/(.*)/);
    return `${refBase}${refMatches[1]}`;
  }

  if (def.enum) {
    return prefix('oneOf(' + stringify(def.enum) + ')');
  }

  switch (def.type) {
    case 'array':
      return prefix('arrayOf(' + propFromDef(def.items, refBase) + ')');

    case 'boolean':
      return prefix('bool');

    case 'integer':
    case 'number':
      return prefix('number');

    case 'object':
      return objectPropType(def, refBase);

    case 'string':
      return prefix('string');

    default:
      throw Error(`Unknown definition type "${def.type}"`);
  }
};

export const propsFromDefs = (defs, refBase = '') => {
  const props = {};
  Object.keys(defs).forEach(
    key => (props[key] = propFromDef(defs[key], refBase))
  );

  return props;
};

export const defsFromUrl = async url => {
  const response = await Swagger.http({ url });
  return response.body.definitions;
};

export const moduleFromDefs = swaggerDefs => {
  const PROPS_REF_BASE = 'props';
  const props = propsFromDefs(swaggerDefs, `${PROPS_REF_BASE}.`);
  const propNames = Object.keys(props);

  return `import ${PT_PREFIX} from 'prop-types';

const ${PROPS_REF_BASE} = {};

${propNames
    .map(propName => `${PROPS_REF_BASE}.${propName} = ${props[propName]}`)
    .join(';\n\n')};

export default props;
`;
};
