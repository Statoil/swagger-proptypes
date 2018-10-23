"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.check = exports.defsFromUrl = exports.propsFromDefs = exports.propFromDef = void 0;

var _propTypes = _interopRequireDefault(require("prop-types"));

var _swaggerClient = _interopRequireDefault(require("swagger-client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const objectPropType = (obj, refBase, nakedObj = false) => {
  const keys = Object.keys(obj.properties);

  if (keys.length === 0) {
    return _propTypes.default.object;
  }

  const shape = {};
  keys.forEach(key => {
    const objDef = obj.properties[key];
    const prop = propFromDef(objDef, refBase);
    const required = !!obj.required && obj.required.includes(key);
    shape[key] = required ? prop.isRequired : prop;
  });
  return nakedObj ? shape : _propTypes.default.exact(shape);
}; // -----------------------------------------------------------------------------


const propFromDef = (def, refBase) => {
  if (def.$ref) {
    const refMatches = def.$ref.match(/#\/definitions\/(.*)/);
    const ref = refBase[refMatches[1]];

    if (ref === undefined) {
      throw Error(`Cannot find definition for reference "${refMatches[1]}"`);
    }

    return refBase[refMatches[1]];
  }

  if (def.enum) {
    return _propTypes.default.oneOf(def.enum);
  }

  switch (def.type) {
    case 'array':
      return _propTypes.default.arrayOf(propFromDef(def.items, refBase));

    case 'boolean':
      return _propTypes.default.bool;

    case 'integer':
    case 'number':
      return _propTypes.default.number;

    case 'object':
      return objectPropType(def, refBase);

    case 'string':
      return _propTypes.default.string;

    default:
      throw Error(`Unknown definition type "${def.type}"`);
  }
};

exports.propFromDef = propFromDef;

const propsFromDefs = defs => {
  const props = {}; // TODO: we must process defs that have references only after those
  // references are created

  Object.keys(defs).forEach( // key => (props[key] = propFromDef(defs[key], props))
  key => props[key] = objectPropType(defs[key], props, true));
  return props;
};

exports.propsFromDefs = propsFromDefs;

const defsFromUrl = async url => {
  const response = await _swaggerClient.default.http({
    url
  });
  return response.body.definitions;
};

exports.defsFromUrl = defsFromUrl;

const check = (...args) => {
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

exports.check = check;