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
      props = {
        p: propFromDef({ type: 'array', items: { type: 'string' } }),
      };
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
      props = {
        p: propFromDef({ type: 'array', items: { type: 'number' } }),
      };
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
      props = {
        p: propFromDef({ type: 'string', enum: ['one', 'two'] }),
      };
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

  describe('keyed objects', () => {
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

  describe('unkeyed objects', () => {
    let props;

    beforeEach(() => {
      props = {
        p: propFromDef({
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
        }),
      };
    });

    test('no errors on success', () => {
      const fn = () =>
        check(props, {
          p: {
            one: 'a string',
            two: 'another string',
          },
        });
      expect(fn).not.toThrow();
    });

    test('errors on wrong unkeyed type', () => {
      const fn = () =>
        check(props, {
          p: { one: 'a string', two: 123 },
        });
      expect(fn).toThrow();
    });
  });

  describe('definition references', () => {
    let props;
    let refBase;

    beforeEach(() => {
      refBase = {
        SomeDef: { three: PropTypes.bool },
      };
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
      const fn = () => check(props, { p: { two: { three: true } } });
      expect(fn).not.toThrow();
    });

    test('errors on failure', () => {
      const fn = () => check(props, { p: { two: 3 } });
      expect(fn).toThrow();
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
          three: {
            type: 'object',
            properties: {
              four: { type: 'string' },
              five: { type: 'string' },
            },
          },
        },
      },
    });
  });

  test('no errors on success (1)', () => {
    const fn = () => check(props.DefOne, { one: 'a string', two: 123 });
    expect(fn).not.toThrow();
  });

  test('no errors on success (2)', () => {
    const fn = () => check(props.DefTwo, { one: false, two: 'b' });
    expect(fn).not.toThrow();
  });

  test('errors on failure - missing required prop', () => {
    const fn = () => check(props.DefOne, { one: 'a string' });
    expect(fn).toThrow();
  });

  test('errors on failure - wrong prop type', () => {
    const fn = () => check(props.DefOne, { two: 'a string' });
    expect(fn).toThrow();
  });

  test('no errors on success - nested props', () => {
    const fn = () => check(props.DefTwo, { three: { five: 'hello' } });
    expect(fn).not.toThrow();
  });

  test('errors on failure - nested extra props', () => {
    const fn = () => check(props.DefTwo, { three: { six: 'hello' } });
    expect(fn).toThrow();
  });

  test('errors on failure - wrong enum value', () => {
    const fn = () => check(props.DefTwo, { two: 'this is invalid' });
    expect(fn).toThrow();
  });
});

describe('non-object full definitions', () => {
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
          three: {
            type: 'object',
            properties: {
              four: { type: 'string' },
              five: { type: 'string' },
            },
          },
        },
      },
      DefThree: {
        type: 'string',
      },
    });
  });

  test('check() ignores non-object definition, even if correct', () => {
    const fn = () => check(props.DefThree, 'I am a string');
    expect(fn).not.toThrow();
  });

  test('check() ignores non-object definition, even if incorrect', () => {
    const fn = () => check(props.DefThree, { thisIs: 'wrong' });
    expect(fn).not.toThrow();
  });
});

describe('complex references', () => {
  let props;

  beforeEach(() => {
    props = propsFromDefs({
      Pet: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
          },
          tags: {
            type: 'array',
            items: { $ref: '#/definitions/Tag' },
          },
        },
      },
      Tag: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'integer',
          },
          name: {
            type: 'string',
          },
        },
      },
    });
  });

  test('Valid simple data should pass', () => {
    const pet = {
      name: 'My Pet',
    };

    const fn = () => check(props.Pet, pet);
    expect(fn).not.toThrow();
  });

  test('Valid nested data should pass', () => {
    const pet = {
      name: 'My Pet',
      tags: [
        { id: 1, name: 'cute' },
        { id: 2, name: 'cuter' },
        { id: 1, name: 'cutest' },
      ],
    };

    const fn = () => check(props.Pet, pet);
    expect(fn).not.toThrow();
  });

  test('Invalid simple data should fail', () => {
    const pet = {
      NoName: 'My Pet',
    };

    const fn = () => check(props.Pet, pet);
    expect(fn).toThrow();
  });

  test('Invalid nested data should fail', () => {
    const pet = {
      name: 'My Pet',
      tags: [
        { id: 1, name: 'cute' },
        { id: 'oops', name: 'cuter' },
        { id: 1, name: 'cutest' },
      ],
    };

    const fn = () => check(props.Pet, pet);
    expect(fn).toThrow();
  });
});

describe('circular references', () => {
  let props;

  beforeEach(() => {
    props = propsFromDefs({
      Node: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
          },
          ancestors: {
            type: 'array',
            items: { $ref: '#/definitions/Node' },
          },
          descendants: {
            type: 'array',
            items: { $ref: '#/definitions/Node' },
          },
        },
      },
    });
  });

  test('circular definitions', () => {
    const node = {
      name: 'My node',
      ancestors: [
        { name: 'Parent A', ancestors: [] },
        { name: 'Parent B', ancestors: [] },
      ],
    };

    const fn = () => check(props.Node, node);
    expect(fn).not.toThrow();
  });

  test('tight circular properties', () => {
    const node = {
      name: 'My node',
    };

    node.ancestors = [node];

    const fn = () => check(props.Node, node);
    expect(fn).not.toThrow();
  });

  test('nested circular properties', () => {
    const node1 = {
      name: 'My node',
      ancestors: [],
    };

    const node2 = {
      name: 'Another node',
      ancestors: [node1],
    };

    node1.ancestors.push(node2);

    const fn = () => check(props.Node, node1);
    expect(fn).not.toThrow();
  });

  test('deeply nested circular properties', () => {
    const node1 = {
      name: 'My node',
      ancestors: [],
    };

    const node2 = {
      name: 'Another node',
      ancestors: [node1],
    };

    const node3 = {
      name: 'Another node',
      ancestors: [node2],
    };

    node1.ancestors.push(node3);

    const fn = () => check(props.Node, node1);
    expect(fn).not.toThrow();
  });

  test('invalid deeply nested circular properties should fail', () => {
    const node1 = {
      name: 'My node',
      ancestors: [],
    };

    const node2 = {
      name: 'Another node',
      ancestors: [node1],
    };

    const node3 = {
      NotAname: 'Another node',
      ancestors: [node2],
    };

    node1.ancestors.push(node3);

    const fn = () => check(props.Node, node1);
    expect(fn).toThrow();
  });
});
