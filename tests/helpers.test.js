import * as helpers from '../src/helpers';

describe('findPropInObject', () => {
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
});
