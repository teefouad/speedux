import storeInstance, { Store } from './store';

describe('Store.js', () => {
  beforeEach(() => {
    Store.removeAllReducers();
    Store.buildInstance();
  });

  it('should have a getInstance method', () => {
    expect(Store.getInstance).toBeInstanceOf(Function);
  });

  it('should return a store instance when calling getInstance()', () => {
    const store = Store.getInstance();
    expect(store).not.toBeUndefined();
    expect(store).toMatchObject({
      dispatch: expect.any(Function),
      getState: expect.any(Function),
      subscribe: expect.any(Function),
    });
  });

  it('should return the same instance every time', () => {
    const storeA = Store.getInstance();
    const storeB = Store.getInstance();
    expect(storeA).toBe(storeB);
  });

  it('should be able to build a new store instance', () => {
    const storeA = Store.getInstance();
    Store.buildInstance();
    const storeB = Store.getInstance();
    expect(storeA).not.toBe(storeB);
  });

  it('should be able to add a reducer', () => {
    const reducer = jest.fn();
    Store.addReducer('test', reducer);
    expect(Store.reducers).toHaveProperty('test', reducer);
  });

  it('should be able to remove a reducer', () => {
    Store.reducers.test = jest.fn();
    Store.removeReducer('test');
    expect(Store.reducers.test).toBeUndefined();
  });

  it('should be able to remove all reducers', () => {
    Store.addReducer('testA', jest.fn());
    Store.addReducer('testB', jest.fn());
    Store.removeAllReducers();
    expect(Store.reducers).toEqual({});
  });

  it('should be able to create a valid root reducer', () => {
    const rootReducer = Store.getRootReducer();
    const state = { $_foo: {} };
    const newState = rootReducer(state);
    expect(rootReducer).toBeInstanceOf(Function);
    expect(newState).toBe(state);
  });

  it('should call all added reducers when an action is dispatched', () => {
    const reducer = jest.fn();
    reducer.mockReturnValue({});
    Store.addReducer('test', reducer);
    Store.update();
    Store.getInstance().dispatch({ type: 'FOO' });
    expect(reducer).toHaveBeenCalled();
  });

  it('should export a store instance', () => {
    expect(storeInstance).toMatchObject({
      dispatch: expect.any(Function),
      getState: expect.any(Function),
      subscribe: expect.any(Function),
    });
  });

  it('should allow using middlewares', () => {
    const middleware = jest.fn(() => next => action => next(action));
    Store.useMiddleware(middleware);
    Store.buildInstance();
    Store.getInstance().dispatch({ type: 'FOO' });
    expect(middleware).toHaveBeenCalled();
  });
});
