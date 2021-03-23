import * as helpers from '../src/helpers';

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
