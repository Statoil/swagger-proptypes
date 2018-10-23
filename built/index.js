"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.moduleFromDefs = exports.defsFromUrl = exports.propsFromDefs = exports.propFromDef = void 0;

var _swaggerClient = _interopRequireDefault(require("swagger-client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
    const required = obj.required && obj.required.includes(key) ? '.isRequired' : '';
    return `  ${stringify(key)}: ${propFromDef(objDef, refBase)}${required}`;
  });
  return prefix('exact({\n') + props.join(',\n') + '\n})';
}; // -----------------------------------------------------------------------------


const propFromDef = (def, refBase = '') => {
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

exports.propFromDef = propFromDef;

const propsFromDefs = (defs, refBase = '') => {
  const props = {};
  Object.keys(defs).forEach(key => props[key] = propFromDef(defs[key], refBase));
  return props;
};

exports.propsFromDefs = propsFromDefs;

const defsFromUrl =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (url) {
    const response = yield _swaggerClient.default.http({
      url
    });
    return response.body.definitions;
  });

  return function defsFromUrl(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.defsFromUrl = defsFromUrl;

const moduleFromDefs = swaggerDefs => {
  const PROPS_REF_BASE = 'props';
  const props = propsFromDefs(swaggerDefs, `${PROPS_REF_BASE}.`);
  const propNames = Object.keys(props);
  return `import ${PT_PREFIX} from 'prop-types';
const ${PROPS_REF_BASE} = {};

${propNames.map(propName => `${PROPS_REF_BASE}.${propName} = ${props[propName]}`).join(';\n\n')};

export default props;
`;
};

exports.moduleFromDefs = moduleFromDefs;