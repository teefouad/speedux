import store from '../src/store';
import createGlobalState, { ERRORS } from '../src/create';

describe('create-global-state', () => {
  beforeEach(() => {
    store.create();
  });

  afterEach(() => {
    store.reset();
  });

  it('should create global state with a default empty object', () => {
    createGlobalState({ name: 'foo' });
    expect(store.getInstance().getState()).toEqual({ foo: {} });
  });

  it('should create global state with the specified state object', () => {
    const state = { value: 1, message: 'hello' };
    createGlobalState({ name: 'baz', state });
    expect(store.getInstance().getState()).toEqual({ baz: state });
  });

  it('should warn if two global states were created using the same name', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    createGlobalState({ name: 'foo' });
    createGlobalState({ name: 'foo' });
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/Duplicate name: foo/));
    spy.mockRestore();
  });

  it('should warn if two global states were created using the same name', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    createGlobalState({ name: 'foo' });
    createGlobalState({ name: 'foo' });
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/Duplicate name: foo/));
    spy.mockRestore();
  });

  it('should throw if the configuration object is not passed', () => {
    expect(() => {
      createGlobalState();
    }).toThrow(ERRORS.MISSING_CONFIG);
  });

  it('should throw if the configuration object is invalid', () => {
    expect(() => {
      createGlobalState(true);
    }).toThrow(ERRORS.INVALID_CONFIG);
  });

  it('should throw if the name is missing', () => {
    expect(() => {
      createGlobalState({});
    }).toThrow(ERRORS.MISSING_NAME);
  });

  it('should throw if the name is invalid', () => {
    expect(() => {
      createGlobalState({ name: 10 });
    }).toThrow(ERRORS.INVALID_NAME);
  });
});
