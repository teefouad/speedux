import {
  registeredReducers,
  registerReducer,
  unregisterReducer,
  unregisterAllReducers,
  getRootReducer,
} from '../src/reducer';

const reducerFactory = () => (state = { foo: 'baz' }) => state;

describe('Reducer', () => {
  beforeEach(() => {
    unregisterAllReducers();
  });

  it('should register a reducer function', () => {
    const reducer = reducerFactory();
    const isRegistered = registerReducer('testReducer', reducer);
    expect(isRegistered).toBe(true);
    expect(registeredReducers).toHaveProperty('testReducer', reducer);
  });

  it('should not register more than one reducer function with the same key', () => {
    const reducer = reducerFactory();
    const isRegistered = registerReducer('testReducer', reducer);
    const anotherReducer = reducerFactory();
    const isRegisteredAgain = registerReducer('testReducer', anotherReducer);
    expect(isRegistered).toBe(true);
    expect(isRegisteredAgain).toBe(false);
  });

  it('should unregister a reducer function', () => {
    registerReducer('testReducer', reducerFactory());
    const isUnRegistered = unregisterReducer('testReducer');
    expect(isUnRegistered).toBe(true);
    expect(registeredReducers).not.toHaveProperty('testReducer');
  });

  it('should not unregister a non-registered reducer function', () => {
    const isUnRegistered = unregisterReducer('testReducer');
    expect(isUnRegistered).toBe(false);
  });

  it('should unregister all reducer functions', () => {
    registerReducer('testReducer', reducerFactory());
    registerReducer('anotherTestReducer', reducerFactory());
    expect(Object.keys(registeredReducers).length).toBe(2);
    unregisterAllReducers();
    expect(Object.keys(registeredReducers).length).toBe(0);
  });

  it('should return a valid root reducer function', () => {
    const rootReducer = getRootReducer();
    expect(rootReducer).toBeInstanceOf(Function);
  });

  it('should return a working root reducer function', () => {
    registerReducer('testReducer', reducerFactory());
    const rootReducer = getRootReducer();
    const state = rootReducer();
    expect(state).toHaveProperty('testReducer.foo', 'baz');
  });
});
