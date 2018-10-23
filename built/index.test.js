"use strict";

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require(".");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('individual props', () => {
  test('fail on unknown type', () => {
    expect(() => (0, _.propFromDef)({
      type: 'whatever'
    })).toThrow();
  });
  describe('primitives', () => {
    test('string', () => {
      expect((0, _.propFromDef)({
        type: 'string'
      })).toBe(_propTypes.default.string);
    });
    test('boolean', () => {
      expect((0, _.propFromDef)({
        type: 'boolean'
      })).toBe(_propTypes.default.bool);
    });
    test('number', () => {
      expect((0, _.propFromDef)({
        type: 'number'
      })).toBe(_propTypes.default.number);
    });
    test('integer', () => {
      expect((0, _.propFromDef)({
        type: 'number'
      })).toBe(_propTypes.default.number);
    });
  });
  describe('array of strings', () => {
    let props;
    beforeEach(() => {
      props = {
        p: (0, _.propFromDef)({
          type: 'array',
          items: {
            type: 'string'
          }
        })
      };
    });
    test('no errors on success', () => {
      const fn = () => (0, _.check)(props, {
        p: ['an', 'array', 'of', 'strings']
      });

      expect(fn).not.toThrow();
    });
    test('errors on failure', () => {
      const fn = () => (0, _.check)(props, {
        p: ['an', 'array', 'of', 4, 'strings']
      });

      expect(fn).toThrow();
    });
  });
  describe('array of numbers', () => {
    let props;
    beforeEach(() => {
      props = {
        p: (0, _.propFromDef)({
          type: 'array',
          items: {
            type: 'number'
          }
        })
      };
    });
    test('no errors on success', () => {
      const fn = () => (0, _.check)(props, {
        p: [1, 2, 3, 4, 5, 6]
      });

      expect(fn).not.toThrow();
    });
    test('errors on failure', () => {
      const fn = () => (0, _.check)(props, {
        p: [1, 2, 3, 4, '5', 6]
      });

      expect(fn).toThrow();
    });
  });
  describe('enums', () => {
    let props;
    beforeEach(() => {
      props = {
        p: (0, _.propFromDef)({
          type: 'string',
          enum: ['one', 'two']
        })
      };
    });
    test('no errors on success', () => {
      const fn = () => (0, _.check)(props, {
        p: 'two'
      });

      expect(fn).not.toThrow();
    });
    test('errors on failure', () => {
      const fn = () => (0, _.check)(props, {
        p: 'three'
      });

      expect(fn).toThrow();
    });
  });
  describe('objects', () => {
    let props;
    beforeEach(() => {
      props = {
        p: (0, _.propFromDef)({
          type: 'object',
          properties: {
            one: {
              type: 'string'
            },
            two: {
              type: 'boolean'
            },
            three: {
              type: 'string'
            }
          },
          required: ['two']
        })
      };
    });
    test('no errors on success', () => {
      const fn = () => (0, _.check)(props, {
        p: {
          one: 'a string',
          two: true,
          three: 'another string'
        }
      });

      expect(fn).not.toThrow();
    });
    test('no errors on missing optional props', () => {
      const fn = () => (0, _.check)(props, {
        p: {
          two: true
        }
      });

      expect(fn).not.toThrow();
    });
    test('errors on missing required props', () => {
      const fn = () => (0, _.check)(props, {
        p: {
          one: 'a string',
          three: 'another string'
        }
      });

      expect(fn).toThrow();
    });
    test('errors on extra props', () => {
      const fn = () => (0, _.check)(props, {
        p: {
          two: false,
          four: 'I should not be here'
        }
      });

      expect(fn).toThrow();
    });
  });
  describe('definition references', () => {
    let props;
    let refBase;
    beforeEach(() => {
      refBase = {
        SomeDef: _propTypes.default.bool
      };
      props = {
        p: (0, _.propFromDef)({
          type: 'object',
          properties: {
            one: {
              type: 'string'
            },
            two: {
              $ref: '#/definitions/SomeDef'
            }
          }
        }, refBase)
      };
    });
    test('no errors on success', () => {
      const fn = () => (0, _.check)(props, {
        p: {
          two: true
        }
      });

      expect(fn).not.toThrow();
    });
    test('errors on failure', () => {
      const fn = () => (0, _.check)(props, {
        p: {
          two: 3
        }
      });

      expect(fn).toThrow();
    });
    test('errors when missing reference', () => {
      expect(() => (0, _.propFromDef)({
        type: 'object',
        properties: {
          one: {
            $ref: '#/definitions/SomeOtherDef'
          }
        }
      })).toThrow();
    });
  });
});
describe('full definitions', () => {
  let props;
  beforeEach(() => {
    props = (0, _.propsFromDefs)({
      DefOne: {
        type: 'object',
        properties: {
          one: {
            type: 'string'
          },
          two: {
            type: 'number'
          }
        },
        required: ['two']
      },
      DefTwo: {
        type: 'object',
        properties: {
          one: {
            type: 'boolean'
          },
          two: {
            type: 'string',
            enum: ['a', 'b', 'c']
          },
          three: {
            type: 'object',
            properties: {
              four: {
                type: 'string'
              },
              five: {
                type: 'string'
              }
            }
          }
        }
      }
    });
  });
  test('no errors on success (1)', () => {
    const fn = () => (0, _.check)(props.DefOne, {
      one: 'a string',
      two: 123
    });

    expect(fn).not.toThrow();
  });
  test('no errors on success (2)', () => {
    const fn = () => (0, _.check)(props.DefTwo, {
      one: false,
      two: 'b'
    });

    expect(fn).not.toThrow();
  });
  test('errors on failure - missing required prop', () => {
    const fn = () => (0, _.check)(props.DefOne, {
      one: 'a string'
    });

    expect(fn).toThrow();
  });
  test('errors on failure - wrong prop type', () => {
    const fn = () => (0, _.check)(props.DefOne, {
      two: 'a string'
    });

    expect(fn).toThrow();
  });
  test('no errors on success - nested props', () => {
    const fn = () => (0, _.check)(props.DefTwo, {
      three: {
        five: 'hello'
      }
    });

    expect(fn).not.toThrow();
  });
  test('errors on failure - nested extra props', () => {
    const fn = () => (0, _.check)(props.DefTwo, {
      three: {
        six: 'hello'
      }
    });

    expect(fn).toThrow();
  });
  test('errors on failure - wrong enum value', () => {
    const fn = () => (0, _.check)(props.DefTwo, {
      two: 'this is invalid'
    });

    expect(fn).toThrow();
  });
});