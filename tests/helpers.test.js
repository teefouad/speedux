import * as helpers from '../src/helpers';

describe('Helpers [getArgNames]', () => {
  const { getArgNames } = helpers;

  it('should be able to handle a function that receives no parameters', () => {
    const argNames = getArgNames('function () { }'); // eslint-disable-line
    expect(argNames).toEqual([]);
  });

  it('should be able to handle a function that receives a single parameter', () => {
    const argNames = getArgNames('function (a) { }'); // eslint-disable-line
    expect(argNames).toEqual(['a']);
  });

  it('should be able to handle a function that receives multiple parameters', () => {
    const argNames = getArgNames('function (a, b, c) { }'); // eslint-disable-line
    expect(argNames).toEqual(['a', 'b', 'c']);
  });

  it('should be able to handle a function that uses default parameter values', () => {
    const argNames = getArgNames('function (a = true, b = 20, c = "dummy") { }'); // eslint-disable-line
    expect(argNames).toEqual(['a', 'b', 'c']);
  });

  it('should be able to handle a function that uses parameter destructure', () => {
    const argNames = getArgNames('function ({ a, b, c }) { }'); // eslint-disable-line
    expect(argNames).toEqual(['a', 'b', 'c']);
  });

  it('should be able to handle a function that uses parameter destructure and default values', () => {
    const argNames = getArgNames('function ({ a = 10, b = "dummy", c = {}, d = true, e = (2 + 3) }) { }'); // eslint-disable-line
    expect(argNames).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('should be able to handle a function that returns another function', () => {
    const argNames = getArgNames('function ({ paramA, paramB = 100 }) { return () => 10; }'); // eslint-disable-line
    expect(argNames).toEqual(['paramA', 'paramB']);
  });

  it('should be able to handle a named function', () => {
    const argNames = getArgNames('function namedFunction({ paramA, paramB = 100, paramC = "abc" }) { return () => 10; }'); // eslint-disable-line
    expect(argNames).toEqual(['paramA', 'paramB', 'paramC']);
  });

  it('should be able to handle arrow functions', () => {
    const argNames = getArgNames('a => a'); // eslint-disable-line
    expect(argNames).toEqual(['a']);
  });

  it('should be able to handle an arrow function with multiple parameters', () => {
    const argNames = getArgNames('(a, b, c) => a'); // eslint-disable-line
    expect(argNames).toEqual(['a', 'b', 'c']);
  });

  it('should be able to handle an arrow function that uses parameter destructure and default values', () => {
    
    const argNames = getArgNames('({ a = 10, b = "dummy", c = {}, d = true }) => { }'); // eslint-disable-line
    expect(argNames).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should be able to handle an arrow function that has a function as a default parameter value', () => {
    const argNames = getArgNames('({ x = () => 10, y = s => s, z = function () { } }) => { }'); // eslint-disable-line
    expect(argNames).toEqual(['x', 'y', 'z']);
  });

  it('function* ({ paramA, paramB = 100, paramC = "abc" }) { return () => 10; }', () => {
    const argNames = getArgNames('function* ({ paramA, paramB = 100, paramC = "abc" }) { return () => 10; }'); // eslint-disable-line
    expect(argNames).toEqual(['paramA', 'paramB', 'paramC']);
  });

  it('function* (paramA, paramB) { return () => 10; }', () => {
    const argNames = getArgNames('function* (paramA, paramB) { return () => 10; }'); // eslint-disable-line
    expect(argNames).toEqual(['paramA', 'paramB']);
  });

  it('function', () => {
    const argNames = getArgNames('function'); // eslint-disable-line
    expect(argNames).toEqual([]);
  });
});

describe('Helpers [snake2CamelCase]', () => {
  it('', () => {

  });
});

describe('Helpers [getObjectType]', () => {
  it('', () => {

  });
});

describe('Helpers [findPropInObject]', () => {
  it('', () => {

  });
});
