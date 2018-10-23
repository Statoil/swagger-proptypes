"use strict";

var _ = require(".");

const PREFIX = 'PropTypes.';
describe('individual props', () => {
  describe('primitives', () => {
    test('string', () => {
      expect((0, _.propFromDef)({
        type: 'string'
      })).toEqual(`${PREFIX}string`);
    });
    test('boolean', () => {
      expect((0, _.propFromDef)({
        type: 'boolean'
      })).toEqual(`${PREFIX}bool`);
    });
    test('number', () => {
      expect((0, _.propFromDef)({
        type: 'number'
      })).toEqual(`${PREFIX}number`);
    });
    test('integer', () => {
      expect((0, _.propFromDef)({
        type: 'number'
      })).toEqual(`${PREFIX}number`);
    });
  });
  describe('arrays', () => {
    test('of strings', () => {
      expect((0, _.propFromDef)({
        type: 'array',
        items: {
          type: 'string'
        }
      })).toEqual(`${PREFIX}arrayOf(${PREFIX}string)`);
    });
    test('of numbers', () => {
      expect((0, _.propFromDef)({
        type: 'array',
        items: {
          type: 'number'
        }
      })).toEqual(`${PREFIX}arrayOf(${PREFIX}number)`);
    });
  });
  describe('enums', () => {
    test('one item', () => {
      expect((0, _.propFromDef)({
        type: 'string',
        enum: ['one']
      })).toEqual(`${PREFIX}oneOf(["one"])`);
    });
    test('several items', () => {
      expect((0, _.propFromDef)({
        type: 'string',
        enum: ['a', 'b', 'c']
      })).toEqual(`${PREFIX}oneOf(["a","b","c"])`);
    });
  });
  describe('objects', () => {
    test('one property', () => {
      expect((0, _.propFromDef)({
        type: 'object',
        properties: {
          one: {
            type: 'string'
          }
        }
      })).toEqual(`${PREFIX}exact({\n  "one": ${PREFIX}string\n})`);
    });
    test('multiple properties', () => {
      expect((0, _.propFromDef)({
        type: 'object',
        properties: {
          one: {
            type: 'number'
          },
          two: {
            type: 'boolean'
          },
          three: {
            type: 'string'
          }
        }
      })).toEqual(`${PREFIX}exact({\n  "one": ${PREFIX}number,\n  "two": ${PREFIX}bool,\n  "three": ${PREFIX}string\n})`);
    });
    test('required properties', () => {
      expect((0, _.propFromDef)({
        type: 'object',
        properties: {
          one: {
            type: 'number'
          },
          two: {
            type: 'boolean'
          }
        },
        required: ['two']
      })).toEqual(`${PREFIX}exact({\n  "one": ${PREFIX}number,\n  "two": ${PREFIX}bool.isRequired\n})`);
    });
    test('required enum', () => {
      expect((0, _.propFromDef)({
        type: 'object',
        properties: {
          one: {
            enum: ['abc', 'def']
          }
        },
        required: ['one']
      })).toEqual(`${PREFIX}exact({\n  "one": ${PREFIX}oneOf(["abc","def"]).isRequired\n})`);
    });
  });
  describe('refs', () => {
    test('without refBase', () => {
      expect((0, _.propFromDef)({
        $ref: '#/definitions/SomeDef'
      })).toEqual('SomeDef');
    });
    test('with refBase', () => {
      expect((0, _.propFromDef)({
        $ref: '#/definitions/SomeDef'
      }, 'props.')).toEqual('props.SomeDef');
    });
  });
});
describe('full definitions', () => {
  const swaggerDefs = {
    DefOne: {
      type: 'object',
      properties: {
        propOneOne: {
          type: 'string'
        },
        propOneTwo: {
          type: 'integer'
        }
      },
      required: ['propOneTwo']
    },
    DefTwo: {
      type: 'object',
      properties: {
        propTwoOne: {
          type: 'boolean'
        },
        propTwoTwo: {
          type: 'string',
          enum: ['a', 'b', 'c']
        }
      }
    }
  };
  test('process all definitions', () => {
    expect(Object.keys((0, _.propsFromDefs)(swaggerDefs))).toEqual(expect.arrayContaining(['DefOne', 'DefTwo']));
  });
  test('generates module', () => {
    expect((0, _.moduleFromDefs)(swaggerDefs)).toEqual(`import PropTypes from 'prop-types';
const props = {};

props.DefOne = ${PREFIX}exact({
  "propOneOne": ${PREFIX}string,
  "propOneTwo": ${PREFIX}number.isRequired
});

props.DefTwo = ${PREFIX}exact({
  "propTwoOne": ${PREFIX}bool,
  "propTwoTwo": ${PREFIX}oneOf(["a","b","c"])
});

export default props;
`);
  });
});