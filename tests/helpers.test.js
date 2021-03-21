import * as helpers from '../src/helpers';

describe('helpers.getObjectType', () => {
  const { getObjectType } = helpers;

  it('should return "object" for an object', () => {
    const obj = {};
    const expected = 'object';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "function" for a function', () => {
    const obj = function foo() { };
    const expected = 'function';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "function" for an arrow function', () => {
    const obj = () => { };
    const expected = 'function';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "generatorfunction" for a generator function', () => {
    const obj = function* generator() { yield null; };
    const expected = 'generatorfunction';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "boolean" for a boolean', () => {
    const obj = true;
    const expected = 'boolean';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "string" for a string', () => {
    const obj = 'foo';
    const expected = 'string';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "number" for a number', () => {
    const obj = 10;
    const expected = 'number';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "undefined" for undefined', () => {
    const obj = undefined;
    const expected = 'undefined';

    expect(getObjectType(obj)).toEqual(expected);
  });

  it('should return "object" for null', () => {
    const obj = null;
    const expected = 'null';

    expect(getObjectType(obj)).toEqual(expected);
  });
});

describe('helpers.findPropInObject', () => {
  const { findPropInObject } = helpers;

  it('should read: empty string', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = '';
    const expected = undefined;

    expect(findPropInObject(obj, path)).toBe(expected);
  });

  it('should read: * where * is an object', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = '*';
    const expected = [
      'baz',
      'buzz',
      'beez',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: * where * is an object', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '*';
    const expected = [
      'baz',
      'buzz',
      'beez',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const expected = 'baz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.baz', () => {
    const obj = {
      foo: {
        baz: 'fiz',
      },
    };
    const path = 'foo.baz';
    const expected = 'fiz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.baz.fizz', () => {
    const obj = {
      foo: {
        baz: {
          fizz: 'buzz',
        },
      },
    };
    const path = 'foo.baz.fizz';
    const expected = 'buzz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: [0]', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '[0]';
    const expected = 'baz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: [0][1]', () => {
    const obj = [
      ['baz', 'buzz', 'beez'],
    ];
    const path = '[0][1]';
    const expected = 'buzz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo[0]', () => {
    const obj = {
      foo: ['baz', 'buzz', 'beez'],
    };
    const path = 'foo[0]';
    const expected = 'baz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: [1].fiz', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: 'buzz' },
    ];
    const path = '[1].fiz';
    const expected = 'buzz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: [1].fiz[0]', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: ['baz', 'buzz', 'beez'] },
    ];
    const path = '[1].fiz[0]';
    const expected = 'baz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: [1].fiz[0][1]', () => {
    const obj = [
      { foo: 'baz' },
      {
        fiz: [
          ['baz', 'buzz', 'beez'],
        ],
      },
    ];
    const path = '[1].fiz[0][1]';
    const expected = 'buzz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo[0].fiz', () => {
    const obj = {
      foo: [
        { fiz: 'buzz' },
      ],
    };
    const path = 'foo[0].fiz';
    const expected = 'buzz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.fizz[0].fiz[1][2].value', () => {
    const obj = {
      foo: {
        fizz: [
          {
            fiz: [
              'baz',
              [
                'beez',
                'boo',
                { value: 'buzz' },
              ],
            ],
          },
        ],
      },
    };
    const path = 'foo.fizz[0].fiz[1][2].value';
    const expected = 'buzz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.*', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo.*';
    const expected = 'baz';

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.* where * is an object', () => {
    const obj = {
      foo: {
        a: { foo: 'baz' },
        b: { foo: 'buzz' },
        c: { foo: 'boo' },
      },
    };
    const path = 'foo.*';
    const expected = [
      { foo: 'baz' },
      { foo: 'buzz' },
      { foo: 'boo' },
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.* where * is an array', () => {
    const obj = {
      foo: [
        'baz',
        'buzz',
        'beez',
      ],
    };
    const path = 'foo.*';
    const expected = [
      'baz',
      'buzz',
      'beez',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: *.foo where * is an object', () => {
    const obj = {
      a: { foo: 'baz' },
      b: { foo: 'buzz' },
      c: { foo: 'boo' },
    };
    const path = '*.foo';
    const expected = [
      'baz',
      'buzz',
      'boo',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: *.foo where * is an array', () => {
    const obj = [
      { foo: 'baz' },
      { foo: 'buzz' },
      { foo: 'boo' },
    ];
    const path = '*.foo';
    const expected = [
      'baz',
      'buzz',
      'boo',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.*.fiz where * is an object', () => {
    const obj = {
      foo: {
        a: { fiz: 'baz' },
        b: { fiz: 'buzz' },
        c: { fiz: 'boo' },
      },
    };
    const path = 'foo.*.fiz';
    const expected = [
      'baz',
      'buzz',
      'boo',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo.*.baz where * is an array', () => {
    const obj = {
      foo: [
        { fiz: 'baz' },
        { fiz: 'buzz' },
        { fiz: 'boo' },
      ],
    };
    const path = 'foo.*.fiz';
    const expected = [
      'baz',
      'buzz',
      'boo',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo[0].fiz.* where * is an object', () => {
    const obj = {
      foo: [
        {
          fiz: {
            a: { foo: 'baz' },
            b: { foo: 'buzz' },
            c: { foo: 'boo' },
          },
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const expected = [
      { foo: 'baz' },
      { foo: 'buzz' },
      { foo: 'boo' },
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo[0].fiz.* where * is an array', () => {
    const obj = {
      foo: [
        {
          fiz: [
            'baz',
            'buzz',
            'boo',
          ],
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const expected = [
      'baz',
      'buzz',
      'boo',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: fizz.*[0] where * is an object', () => {
    const obj = {
      fizz: {
        a: ['baz'],
        b: ['buzz'],
        c: ['boo'],
      },
    };
    const path = 'fizz.*[0]';
    const expected = [
      'baz',
      'buzz',
      'boo',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: fizz.*[0] where * is an array', () => {
    const obj = {
      fizz: [
        ['baz'],
        ['buzz'],
        ['boo'],
      ],
    };
    const path = 'fizz.*[0]';
    const expected = [
      'baz',
      'buzz',
      'boo',
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: foo[0].*.fiz.*.* where * is an object', () => {
    const obj = {
      foo: [
        {
          a: {
            fiz: [
              ['a', 'b'],
              ['c', 'd'],
            ],
          },
          b: {
            fiz: [
              ['a', 'b'],
              ['c', 'd'],
            ],
          },
          c: {
            fiz: [
              ['a', 'b'],
              ['c', 'd'],
            ],
          },
        },
      ],
    };
    const path = 'foo[0].*.fiz.*.*';
    const expected = [
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
    ];

    expect(findPropInObject(obj, path)).toEqual(expected);
  });

  it('should read: no existing key', () => {
    const obj = {};
    const path = 'foo.fiz.fuzz';
    const expected = undefined;

    expect(findPropInObject(obj, path)).toBe(expected);
  });

  it('should read: foo by reference', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const result = findPropInObject(obj, path, true);

    expect(result).toBe('baz');
  });

  it('should write: empty string', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = '';
    const expected = { ...obj };

    expect(findPropInObject(obj, path, false, 'baz')).toEqual(expected);
  });

  it('should write: * where * is an object', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = '*';
    const expected = {
      foo: 'boo',
      fiz: 'boo',
      fae: 'boo',
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: * where * is an array', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '*';
    const expected = [
      'boo',
      'boo',
      'boo',
    ];

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const expected = {
      foo: 'boo',
      fiz: 'buzz',
      fae: 'beez',
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo.baz', () => {
    const obj = {
      foo: {
        baz: 'fiz',
      },
    };
    const path = 'foo.baz';
    const expected = {
      foo: {
        baz: 'boo',
      },
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo.baz.fizz', () => {
    const obj = {
      foo: {
        baz: {
          fizz: 'buzz',
        },
      },
    };
    const path = 'foo.baz.fizz';
    const expected = {
      foo: {
        baz: {
          fizz: 'boo',
        },
      },
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: [0]', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '[0]';
    const expected = [
      'boo',
      'buzz',
      'beez',
    ];

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: [0][1]', () => {
    const obj = [
      ['baz', 'buzz', 'beez'],
    ];
    const path = '[0][1]';
    const expected = [
      ['baz', 'boo', 'beez'],
    ];

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo[0]', () => {
    const obj = {
      foo: ['baz', 'buzz', 'beez'],
    };
    const path = 'foo[0]';
    const expected = {
      foo: ['boo', 'buzz', 'beez'],
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: [1].fiz', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: 'buzz' },
    ];
    const path = '[1].fiz';
    const expected = [
      { foo: 'baz' },
      { fiz: 'boo' },
    ];

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: [1].fiz[0]', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: ['baz', 'buzz', 'beez'] },
    ];
    const path = '[1].fiz[0]';
    const expected = [
      { foo: 'baz' },
      { fiz: ['boo', 'buzz', 'beez'] },
    ];

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: [1].fiz[0][1]', () => {
    const obj = [
      { foo: 'baz' },
      {
        fiz: [
          ['baz', 'buzz', 'beez'],
        ],
      },
    ];
    const path = '[1].fiz[0][1]';
    const expected = [
      { foo: 'baz' },
      {
        fiz: [
          ['baz', 'boo', 'beez'],
        ],
      },
    ];

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo[0].fiz', () => {
    const obj = {
      foo: [
        { fiz: 'buzz' },
      ],
    };
    const path = 'foo[0].fiz';
    const expected = {
      foo: [
        { fiz: 'boo' },
      ],
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo.fizz[0].fiz[1][2].value', () => {
    const obj = {
      foo: {
        fizz: [
          {
            fiz: [
              'baz',
              [
                'beez',
                'boo',
                { value: 'buzz' },
              ],
            ],
          },
        ],
      },
    };
    const path = 'foo.fizz[0].fiz[1][2].value';
    const expected = {
      foo: {
        fizz: [
          {
            fiz: [
              'baz',
              [
                'beez',
                'boo',
                { value: 'boo' },
              ],
            ],
          },
        ],
      },
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo.* where * is an object', () => {
    const obj = {
      foo: {
        foo: 'baz',
        fiz: 'buzz',
        fae: 'beez',
      },
    };
    const path = 'foo.*';
    const expected = {
      foo: {
        foo: 'boo',
        fiz: 'boo',
        fae: 'boo',
      },
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo.* where * is an array', () => {
    const obj = {
      foo: [
        'baz',
        'buzz',
        'beez',
      ],
    };
    const path = 'foo.*';
    const expected = {
      foo: [
        'boo',
        'boo',
        'boo',
      ],
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: *.foo where * is an object', () => {
    const obj = {
      a: { foo: 'baz' },
      b: { foo: 'buzz' },
      c: { foo: 'boo' },
    };
    const path = '*.foo';
    const expected = {
      a: { foo: 'baz' },
      b: { foo: 'baz' },
      c: { foo: 'baz' },
    };

    expect(findPropInObject(obj, path, false, 'baz')).toEqual(expected);
  });

  it('should write: *.foo where * is an array', () => {
    const obj = [
      { foo: 'baz' },
      { foo: 'buzz' },
      { foo: 'boo' },
    ];
    const path = '*.foo';
    const expected = [
      { foo: 'baz' },
      { foo: 'baz' },
      { foo: 'baz' },
    ];

    expect(findPropInObject(obj, path, false, 'baz')).toEqual(expected);
  });

  it('should write: foo.*.fiz where * is an object', () => {
    const obj = {
      foo: {
        a: { fiz: 'baz' },
        b: { fiz: 'buzz' },
        c: { fiz: 'boo' },
      },
    };
    const path = 'foo.*.fiz';
    const expected = {
      foo: {
        a: { fiz: 'baz' },
        b: { fiz: 'baz' },
        c: { fiz: 'baz' },
      },
    };

    expect(findPropInObject(obj, path, false, 'baz')).toEqual(expected);
  });

  it('should write: foo.*.baz where * is an array', () => {
    const obj = {
      foo: [
        { fiz: 'baz' },
        { fiz: 'buzz' },
        { fiz: 'boo' },
      ],
    };
    const path = 'foo.*.fiz';
    const expected = {
      foo: [
        { fiz: 'baz' },
        { fiz: 'baz' },
        { fiz: 'baz' },
      ],
    };

    expect(findPropInObject(obj, path, false, 'baz')).toEqual(expected);
  });

  it('should write: foo[0].fiz.* where * is an object', () => {
    const obj = {
      foo: [
        {
          fiz: {
            a: { foo: 'baz' },
            b: { foo: 'buzz' },
            c: { foo: 'boo' },
          },
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const expected = {
      foo: [
        {
          fiz: {
            a: 'baz',
            b: 'baz',
            c: 'baz',
          },
        },
      ],
    };

    expect(findPropInObject(obj, path, false, 'baz')).toEqual(expected);
  });

  it('should write: foo[0].fiz.* where * is an array', () => {
    const obj = {
      foo: [
        {
          fiz: [
            'baz',
            'buzz',
            'boo',
          ],
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const expected = {
      foo: [
        {
          fiz: [
            'baz',
            'baz',
            'baz',
          ],
        },
      ],
    };

    expect(findPropInObject(obj, path, false, 'baz')).toEqual(expected);
  });

  it('should write: fizz.*[0] where * is an object', () => {
    const obj = {
      fizz: {
        a: ['baz'],
        b: ['buzz'],
        c: ['boo'],
      },
    };
    const path = 'fizz.*[0]';
    const expected = {
      fizz: {
        a: ['foo'],
        b: ['foo'],
        c: ['foo'],
      },
    };

    expect(findPropInObject(obj, path, false, 'foo')).toEqual(expected);
  });

  it('should write: fizz.*[0] where * is an array', () => {
    const obj = {
      fizz: [
        ['baz'],
        ['buzz'],
        ['boo'],
      ],
    };
    const path = 'fizz.*[0]';
    const expected = {
      fizz: [
        ['foo'],
        ['foo'],
        ['foo'],
      ],
    };

    expect(findPropInObject(obj, path, false, 'foo')).toEqual(expected);
  });

  it('should write: no existing key', () => {
    const obj = {};
    const path = 'foo.fiz.fuzz';
    const expected = {
      foo: {
        fiz: {
          fuzz: 'boo',
        },
      },
    };

    expect(findPropInObject(obj, path, false, 'boo')).toEqual(expected);
  });

  it('should write: foo by reference', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const result = findPropInObject(obj, path, true, 'boo');

    expect(result).toBe(obj);
    expect(obj).toEqual({
      foo: 'boo',
      fiz: 'buzz',
      fae: 'beez',
    });
  });

  it('should delete: empty string', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = '';
    const expected = { ...obj };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: * where * is an object', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = '*';
    const expected = {};

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: * where * is an array', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '*';
    const expected = [];

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const expected = {
      fiz: 'buzz',
      fae: 'beez',
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo.baz', () => {
    const obj = {
      foo: {
        baz: 'fiz',
      },
    };
    const path = 'foo.baz';
    const expected = {
      foo: {},
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo.baz.fizz', () => {
    const obj = {
      foo: {
        baz: {
          fizz: 'buzz',
        },
      },
    };
    const path = 'foo.baz.fizz';
    const expected = {
      foo: {
        baz: {},
      },
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: [0]', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '[0]';
    const expected = [
      'buzz',
      'beez',
    ];

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: [0][1]', () => {
    const obj = [
      ['baz', 'buzz', 'beez'],
    ];
    const path = '[0][1]';
    const expected = [
      ['baz', 'beez'],
    ];

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo[0]', () => {
    const obj = {
      foo: ['baz', 'buzz', 'beez'],
    };
    const path = 'foo[0]';
    const expected = {
      foo: ['buzz', 'beez'],
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: [1].fiz', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: 'buzz' },
    ];
    const path = '[1].fiz';
    const expected = [
      { foo: 'baz' },
      {},
    ];

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: [1].fiz[0]', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: ['baz', 'buzz', 'beez'] },
    ];
    const path = '[1].fiz[0]';
    const expected = [
      { foo: 'baz' },
      { fiz: ['buzz', 'beez'] },
    ];

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: [1].fiz[0][1]', () => {
    const obj = [
      { foo: 'baz' },
      {
        fiz: [
          ['baz', 'buzz', 'beez'],
        ],
      },
    ];
    const path = '[1].fiz[0][1]';
    const expected = [
      { foo: 'baz' },
      {
        fiz: [
          ['baz', 'beez'],
        ],
      },
    ];

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo[0].fiz', () => {
    const obj = {
      foo: [
        { fiz: 'buzz' },
      ],
    };
    const path = 'foo[0].fiz';
    const expected = {
      foo: [
        {},
      ],
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo.fizz[0].fiz[1][2].value', () => {
    const obj = {
      foo: {
        fizz: [
          {
            fiz: [
              'baz',
              [
                'beez',
                'boo',
                { value: 'buzz' },
              ],
            ],
          },
        ],
      },
    };
    const path = 'foo.fizz[0].fiz[1][2].value';
    const expected = {
      foo: {
        fizz: [
          {
            fiz: [
              'baz',
              [
                'beez',
                'boo',
                {},
              ],
            ],
          },
        ],
      },
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo.* where * is an object', () => {
    const obj = {
      foo: {
        foo: 'baz',
        fiz: 'buzz',
        fae: 'beez',
      },
    };
    const path = 'foo.*';
    const expected = {
      foo: {},
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo.* where * is an array', () => {
    const obj = {
      foo: [
        'baz',
        'buzz',
        'beez',
      ],
    };
    const path = 'foo.*';
    const expected = {
      foo: [],
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: *.foo where * is an object', () => {
    const obj = {
      a: { foo: 'baz' },
      b: { foo: 'buzz' },
      c: { foo: 'boo' },
    };
    const path = '*.foo';
    const expected = {
      a: {},
      b: {},
      c: {},
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: *.foo where * is an array', () => {
    const obj = [
      { foo: 'baz' },
      { foo: 'buzz' },
      { foo: 'boo' },
    ];
    const path = '*.foo';
    const expected = [
      {},
      {},
      {},
    ];

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo.*.fiz where * is an object', () => {
    const obj = {
      foo: {
        a: { fiz: 'baz' },
        b: { fiz: 'buzz' },
        c: { fiz: 'boo' },
      },
    };
    const path = 'foo.*.fiz';
    const expected = {
      foo: {
        a: {},
        b: {},
        c: {},
      },
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo.*.baz where * is an array', () => {
    const obj = {
      foo: [
        { fiz: 'baz' },
        { fiz: 'buzz' },
        { fiz: 'boo' },
      ],
    };
    const path = 'foo.*.fiz';
    const expected = {
      foo: [
        {},
        {},
        {},
      ],
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo[0].fiz.* where * is an object', () => {
    const obj = {
      foo: [
        {
          fiz: {
            a: { foo: 'baz' },
            b: { foo: 'buzz' },
            c: { foo: 'boo' },
          },
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const expected = {
      foo: [
        {
          fiz: {},
        },
      ],
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo[0].fiz.* where * is an array', () => {
    const obj = {
      foo: [
        {
          fiz: [
            'baz',
            'buzz',
            'boo',
          ],
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const expected = {
      foo: [
        {
          fiz: [],
        },
      ],
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: fizz.*[0] where * is an object', () => {
    const obj = {
      fizz: {
        a: ['baz'],
        b: ['buzz'],
        c: ['boo'],
      },
    };
    const path = 'fizz.*[0]';
    const expected = {
      fizz: {
        a: [],
        b: [],
        c: [],
      },
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: fizz.*[0] where * is an array', () => {
    const obj = {
      fizz: [
        ['baz'],
        ['buzz'],
        ['boo'],
      ],
    };
    const path = 'fizz.*[0]';
    const expected = {
      fizz: [
        [],
        [],
        [],
      ],
    };

    expect(findPropInObject(obj, path, false, undefined)).toEqual(expected);
  });

  it('should delete: foo by reference', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const result = findPropInObject(obj, path, true, undefined);

    expect(result).toBe(obj);
    expect(obj).toEqual({
      fiz: 'buzz',
      fae: 'beez',
    });
  });

  it('should resolve: * where * is an object', () => {
    const obj = {
      a: 10,
      b: 20,
      c: 30,
    };
    const path = '*';
    const resolver = x => 2 * x;
    const expected = {
      a: 20,
      b: 40,
      c: 60,
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: * where * is an array', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '*';
    const resolver = x => x.slice(1);
    const expected = [
      'az',
      'uzz',
      'eez',
    ];

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const resolver = x => x + x;
    const expected = {
      foo: 'bazbaz',
      fiz: 'buzz',
      fae: 'beez',
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo.baz', () => {
    const obj = {
      foo: {
        baz: 50,
      },
    };
    const path = 'foo.baz';
    const resolver = x => 0.5 * x;
    const expected = {
      foo: {
        baz: 25,
      },
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo.baz.fizz', () => {
    const obj = {
      foo: {
        baz: {
          fizz: 'buzz',
        },
      },
    };
    const path = 'foo.baz.fizz';
    const resolver = x => x.replace(/z/g, '');
    const expected = {
      foo: {
        baz: {
          fizz: 'bu',
        },
      },
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: [0]', () => {
    const obj = [
      'baz',
      'buzz',
      'beez',
    ];
    const path = '[0]';
    const resolver = () => 'boo';
    const expected = [
      'boo',
      'buzz',
      'beez',
    ];

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: [0][1]', () => {
    const obj = [
      ['baz', 'buzz', 'beez'],
    ];
    const path = '[0][1]';
    const resolver = x => x + x;
    const expected = [
      ['baz', 'buzzbuzz', 'beez'],
    ];

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo[0]', () => {
    const obj = {
      foo: [50, 'buzz', 'beez'],
    };
    const path = 'foo[0]';
    const resolver = x => 2 * x;
    const expected = {
      foo: [100, 'buzz', 'beez'],
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: [1].fiz', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: 'buzz' },
    ];
    const path = '[1].fiz';
    const resolver = x => x + x;
    const expected = [
      { foo: 'baz' },
      { fiz: 'buzzbuzz' },
    ];

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: [1].fiz[0]', () => {
    const obj = [
      { foo: 'baz' },
      { fiz: [50, 'buzz', 'beez'] },
    ];
    const path = '[1].fiz[0]';
    const resolver = x => 2 * x;
    const expected = [
      { foo: 'baz' },
      { fiz: [100, 'buzz', 'beez'] },
    ];

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: [1].fiz[0][1]', () => {
    const obj = [
      { foo: 'baz' },
      {
        fiz: [
          ['baz', 10, 'beez'],
        ],
      },
    ];
    const path = '[1].fiz[0][1]';
    const resolver = x => 2 * x;
    const expected = [
      { foo: 'baz' },
      {
        fiz: [
          ['baz', 20, 'beez'],
        ],
      },
    ];

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo[0].fiz', () => {
    const obj = {
      foo: [
        { fiz: 40 },
      ],
    };
    const path = 'foo[0].fiz';
    const resolver = x => 2 * x;
    const expected = {
      foo: [
        { fiz: 80 },
      ],
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo.fizz[0].fiz[1][2].value', () => {
    const obj = {
      foo: {
        fizz: [
          {
            fiz: [
              'baz',
              [
                'beez',
                'boo',
                { value: 'buzz' },
              ],
            ],
          },
        ],
      },
    };
    const path = 'foo.fizz[0].fiz[1][2].value';
    const resolver = () => undefined;
    const expected = {
      foo: {
        fizz: [
          {
            fiz: [
              'baz',
              [
                'beez',
                'boo',
                {},
              ],
            ],
          },
        ],
      },
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo.* where * is an object', () => {
    const obj = {
      foo: {
        foo: 'baz',
        fiz: 'buzz',
        fae: 'beez',
      },
    };
    const path = 'foo.*';
    const resolver = x => (x.length > 3 ? undefined : x);
    const expected = {
      foo: {
        foo: 'baz',
      },
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo.* where * is an array', () => {
    const obj = {
      foo: [
        'baz',
        'buzz',
        'beez',
      ],
    };
    const path = 'foo.*';
    const resolver = x => (x.length > 3 ? undefined : x);
    const expected = {
      foo: ['baz'],
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: *.foo where * is an object', () => {
    const obj = {
      a: { foo: 'baz' },
      b: { foo: 'buzz' },
      c: { foo: 'boo' },
    };
    const path = '*.foo';
    const resolver = x => (x.length > 3 ? undefined : x);
    const expected = {
      a: { foo: 'baz' },
      b: {},
      c: { foo: 'boo' },
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: *.foo where * is an array', () => {
    const obj = [
      { foo: 'baz' },
      { foo: 'buzz' },
      { foo: 'boo' },
    ];
    const path = '*.foo';
    const resolver = x => (x.length < 4 ? undefined : x);
    const expected = [
      {},
      { foo: 'buzz' },
      {},
    ];

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo.*.fiz where * is an object', () => {
    const obj = {
      foo: {
        a: { fiz: 'baz' },
        b: { fiz: 'buzz' },
        c: { fiz: 'boo' },
      },
    };
    const path = 'foo.*.fiz';
    const resolver = x => (x.length > 3 ? undefined : x.replace(/b/g, ''));
    const expected = {
      foo: {
        a: { fiz: 'az' },
        b: {},
        c: { fiz: 'oo' },
      },
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo.*.baz where * is an array', () => {
    const obj = {
      foo: [
        { fiz: 'baz' },
        { fiz: 'buzz' },
        { fiz: 'boo' },
      ],
    };
    const path = 'foo.*.fiz';
    const resolver = x => (x.length > 3 ? undefined : x.replace(/b/g, ''));
    const expected = {
      foo: [
        { fiz: 'az' },
        {},
        { fiz: 'oo' },
      ],
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo[0].fiz.* where * is an object', () => {
    const obj = {
      foo: [
        {
          fiz: {
            a: { foo: 20 },
            b: { foo: 20 },
            c: { foo: 20 },
          },
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const resolver = x => 2 * x.foo;
    const expected = {
      foo: [
        {
          fiz: {
            a: 40,
            b: 40,
            c: 40,
          },
        },
      ],
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo[0].fiz.* where * is an array', () => {
    const obj = {
      foo: [
        {
          fiz: [
            'baz',
            'buzz',
            'boo',
          ],
        },
      ],
    };
    const path = 'foo[0].fiz.*';
    const resolver = x => x.replace(/b/g, '');
    const expected = {
      foo: [
        {
          fiz: [
            'az',
            'uzz',
            'oo',
          ],
        },
      ],
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: fizz.*[0] where * is an object', () => {
    const obj = {
      fizz: {
        a: ['baz'],
        b: ['buzz'],
        c: ['boo'],
      },
    };
    const path = 'fizz.*[0]';
    const resolver = x => x.slice(2);
    const expected = {
      fizz: {
        a: ['z'],
        b: ['zz'],
        c: ['o'],
      },
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: fizz.*[0] where * is an array', () => {
    const obj = {
      fizz: [
        ['baz'],
        ['buzz'],
        ['boo'],
      ],
    };
    const path = 'fizz.*[0]';
    const resolver = x => x.slice(2);
    const expected = {
      fizz: [
        ['z'],
        ['zz'],
        ['o'],
      ],
    };

    expect(findPropInObject(obj, path, false, resolver)).toEqual(expected);
  });

  it('should resolve: foo by reference', () => {
    const obj = {
      foo: 'baz',
      fiz: 'buzz',
      fae: 'beez',
    };
    const path = 'foo';
    const resolver = x => x.slice(2);
    const result = findPropInObject(obj, path, true, resolver);

    expect(result).toBe(obj);
    expect(obj).toEqual({
      foo: 'z',
      fiz: 'buzz',
      fae: 'beez',
    });
  });
});

describe('helpers.toCamelCase', () => {
  const { toCamelCase } = helpers;

  it('should convert: foo', () => {
    expect(toCamelCase('foo')).toBe('foo');
  });

  it('should convert: fooBaz', () => {
    expect(toCamelCase('fooBaz')).toBe('fooBaz');
  });

  it('should convert: fooBazFiz', () => {
    expect(toCamelCase('fooBazFiz')).toBe('fooBazFiz');
  });

  it('should convert: foo baz', () => {
    expect(toCamelCase('foo baz')).toBe('fooBaz');
  });

  it('should convert: foo-baz', () => {
    expect(toCamelCase('foo-baz')).toBe('fooBaz');
  });

  it('should convert: foo_baz', () => {
    expect(toCamelCase('foo_baz')).toBe('fooBaz');
  });

  it('should convert: FIZ_BAZ', () => {
    expect(toCamelCase('FIZ_BAZ')).toBe('fizBaz');
  });

  it('should convert: doFIZ_Baz', () => {
    expect(toCamelCase('doFIZ_Baz')).toBe('doFizBaz');
  });

  it('should convert: foo_bazDo', () => {
    expect(toCamelCase('foo_bazDo')).toBe('fooBazDo');
  });

  it('should convert: foo_bazDo Something', () => {
    expect(toCamelCase('foo_bazDo Something')).toBe('fooBazDoSomething');
  });

  it('should convert: foo_baz-Do SomeThing', () => {
    expect(toCamelCase('foo_baz-Do SomeThing')).toBe('fooBazDoSomeThing');
  });
});

describe('helpers.toSnakeCase', () => {
  const { toSnakeCase } = helpers;

  it('should convert: foo', () => {
    expect(toSnakeCase('foo')).toBe('foo');
  });

  it('should convert: fooBaz', () => {
    expect(toSnakeCase('fooBaz')).toBe('foo_baz');
  });

  it('should convert: foo baz', () => {
    expect(toSnakeCase('foo baz')).toBe('foo_baz');
  });

  it('should convert: foo-baz', () => {
    expect(toSnakeCase('foo-baz')).toBe('foo_baz');
  });

  it('should convert: foo_baz', () => {
    expect(toSnakeCase('foo_baz')).toBe('foo_baz');
  });

  it('should convert: foo_bazDo', () => {
    expect(toSnakeCase('foo_bazDo')).toBe('foo_baz_do');
  });

  it('should convert: foo_bazDo Something', () => {
    expect(toSnakeCase('foo_bazDo Something')).toBe('foo_baz_do_something');
  });

  it('should convert: foo_baz-Do SomeThing', () => {
    expect(toSnakeCase('foo_baz-Do SomeThing')).toBe('foo_baz_do_some_thing');
  });

  it('should convert: FOO uppercase', () => {
    expect(toSnakeCase('FOO')).toBe('foo');
  });
});

describe('helpers.deepCopy', () => {
  const { deepCopy } = helpers;

  it('should copy one level deep object', () => {
    const obj = { foo: 'FOO', baz: 'BAZ' };
    expect(deepCopy(obj)).toEqual(obj);
    expect(deepCopy(obj)).not.toBe(obj);
  });

  it('should copy two levels deep object', () => {
    const obj = {
      foo: 'FOO',
      baz: 'BAZ',
      fiz: {
        foo: 'FOO',
        baz: 'BAZ',
      },
    };
    expect(deepCopy(obj).fiz).toEqual(obj.fiz);
    expect(deepCopy(obj).fiz).not.toBe(obj.fiz);
  });

  it('should copy three levels deep object', () => {
    const obj = {
      foo: 'FOO',
      baz: 'BAZ',
      fiz: {
        foo: 'FOO',
        baz: 'BAZ',
        fae: {
          foo: 'FOO',
          baz: 'BAZ',
        },
      },
    };
    expect(deepCopy(obj).fiz.fae).toEqual(obj.fiz.fae);
    expect(deepCopy(obj).fiz.fae).not.toBe(obj.fiz.fae);
  });

  it('should copy an array', () => {
    const obj = ['foo', 'baz', 'fiz'];
    expect(deepCopy(obj)).toEqual(obj);
    expect(deepCopy(obj)).not.toBe(obj);
  });

  it('should copy an array of objects', () => {
    const obj = [
      'foo',
      'baz',
      {
        foo: 'FOO',
        baz: 'BAZ',
      },
    ];
    expect(deepCopy(obj[2])).toEqual(obj[2]);
    expect(deepCopy(obj[2])).not.toBe(obj[2]);
  });

  it('should copy an array of two levels deep objects', () => {
    const obj = [
      'foo',
      'baz',
      {
        foo: 'FOO',
        baz: 'BAZ',
        fiz: {
          foo: 'FOO',
          baz: 'BAZ',
        },
      },
    ];
    expect(deepCopy(obj[2].fiz)).toEqual(obj[2].fiz);
    expect(deepCopy(obj[2].fiz)).not.toBe(obj[2].fiz);
  });
});
