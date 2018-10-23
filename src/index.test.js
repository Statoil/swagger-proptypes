import PropTypes from 'prop-types';
import { propFromDef, propsFromDefs, check } from '.';

describe('individual props', () => {
  test('fail on unknown type', () => {
    expect(() => propFromDef({ type: 'whatever' })).toThrow();
  });

  describe('primitives', () => {
    test('string', () => {
      expect(propFromDef({ type: 'string' })).toBe(PropTypes.string);
    });

    test('boolean', () => {
      expect(propFromDef({ type: 'boolean' })).toBe(PropTypes.bool);
    });

    test('number', () => {
      expect(propFromDef({ type: 'number' })).toBe(PropTypes.number);
    });

    test('integer', () => {
      expect(propFromDef({ type: 'number' })).toBe(PropTypes.number);
    });
  });

  describe('array of strings', () => {
    let props;

    beforeEach(() => {
      props = { p: propFromDef({ type: 'array', items: { type: 'string' } }) };
    });

    test('no errors on success', () => {
      const fn = () => check(props, { p: ['an', 'array', 'of', 'strings'] });
      expect(fn).not.toThrow();
    });

    test('errors on failure', () => {
      const fn = () => check(props, { p: ['an', 'array', 'of', 4, 'strings'] });
      expect(fn).toThrow();
    });
  });

  describe('array of numbers', () => {
    let props;

    beforeEach(() => {
      props = { p: propFromDef({ type: 'array', items: { type: 'number' } }) };
    });

    test('no errors on success', () => {
      const fn = () => check(props, { p: [1, 2, 3, 4, 5, 6] });
      expect(fn).not.toThrow();
    });

    test('errors on failure', () => {
      const fn = () => check(props, { p: [1, 2, 3, 4, '5', 6] });
      expect(fn).toThrow();
    });
  });

  describe('enums', () => {
    let props;

    beforeEach(() => {
      props = { p: propFromDef({ type: 'string', enum: ['one', 'two'] }) };
    });

    test('no errors on success', () => {
      const fn = () => check(props, { p: 'two' });
      expect(fn).not.toThrow();
    });

    test('errors on failure', () => {
      const fn = () => check(props, { p: 'three' });
      expect(fn).toThrow();
    });
  });

  describe('objects', () => {
    let props;

    beforeEach(() => {
      props = {
        p: propFromDef({
          type: 'object',
          properties: {
            one: { type: 'string' },
            two: { type: 'boolean' },
            three: { type: 'string' },
          },
          required: ['two'],
        }),
      };
    });

    test('no errors on success', () => {
      const fn = () =>
        check(props, {
          p: {
            one: 'a string',
            two: true,
            three: 'another string',
          },
        });
      expect(fn).not.toThrow();
    });

    test('no errors on missing optional props', () => {
      const fn = () => check(props, { p: { two: true } });
      expect(fn).not.toThrow();
    });

    test('errors on missing required props', () => {
      const fn = () =>
        check(props, {
          p: { one: 'a string', three: 'another string' },
        });
      expect(fn).toThrow();
    });

    test('errors on extra props', () => {
      const fn = () =>
        check(props, {
          p: { two: false, four: 'I should not be here' },
        });
      expect(fn).toThrow();
    });
  });

  describe('definition references', () => {
    let props;
    let refBase;

    beforeEach(() => {
      refBase = { SomeDef: PropTypes.bool };
      props = {
        p: propFromDef(
          {
            type: 'object',
            properties: {
              one: { type: 'string' },
              two: { $ref: '#/definitions/SomeDef' },
            },
          },
          refBase
        ),
      };
    });

    test('no errors on success', () => {
      const fn = () => check(props, { p: { two: true } });
      expect(fn).not.toThrow();
    });

    test('errors on failure', () => {
      const fn = () => check(props, { p: { two: 3 } });
      expect(fn).toThrow();
    });

    test('errors when missing reference', () => {
      expect(() =>
        propFromDef({
          type: 'object',
          properties: {
            one: { $ref: '#/definitions/SomeOtherDef' },
          },
        })
      ).toThrow();
    });
  });
});

describe('full definitions', () => {
  let props;

  beforeEach(() => {
    props = propsFromDefs({
      DefOne: {
        type: 'object',
        properties: {
          one: { type: 'string' },
          two: { type: 'number' },
        },
        required: ['two'],
      },
      DefTwo: {
        type: 'object',
        properties: {
          one: { type: 'boolean' },
          two: { type: 'string', enum: ['a', 'b', 'c'] },
        },
      },
    });
  });

  test('no errors on success (1)', () => {
    const fn = () =>
      check({ p: props.DefOne }, { p: { one: 'a string', two: 123 } });
    expect(fn).not.toThrow();
  });

  test('no errors on success (2)', () => {
    const fn = () =>
      check({ p: props.DefTwo }, { p: { one: false, two: 'b' } });
    expect(fn).not.toThrow();
  });

  test('errors on failure - missing required prop', () => {
    const fn = () => check({ p: props.DefOne }, { p: { one: 'a string' } });
    expect(fn).toThrow();
  });

  test('errors on failure - wrong prop type', () => {
    const fn = () => check({ p: props.DefOne }, { p: { two: 'a string' } });
    expect(fn).toThrow();
  });

  test('errors on failure - extra props', () => {
    const fn = () => check({ p: props.DefTwo }, { p: { three: 'hello' } });
    expect(fn).toThrow();
  });

  test('errors on failure - wrong enum value', () => {
    const fn = () =>
      check({ p: props.DefTwo }, { p: { two: 'this is invalid' } });
    expect(fn).toThrow();
  });
});
