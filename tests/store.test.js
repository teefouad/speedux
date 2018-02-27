import storeInstance, { StoreManager } from './store';

describe('store.js', () => {
  beforeEach(() => {
    StoreManager.removeAllReducers();
    StoreManager.buildInstance();
  });

  it('should have a getInstance method', () => {
    expect(StoreManager.getInstance).toBeInstanceOf(Function);
  });

  it('should return a store instance when calling getInstance()', () => {
    const store = StoreManager.getInstance();
    expect(store).not.toBeUndefined();
    expect(store).toMatchObject({
      dispatch: expect.any(Function),
      getState: expect.any(Function),
      subscribe: expect.any(Function),
    });
  });

  it('should return the same instance every time', () => {
    const storeA = StoreManager.getInstance();
    const storeB = StoreManager.getInstance();
    expect(storeA).toBe(storeB);
  });

  it('should be able to build a new store instance', () => {
    const storeA = StoreManager.getInstance();
    StoreManager.buildInstance();
    const storeB = StoreManager.getInstance();
    expect(storeA).not.toBe(storeB);
  });

  it('should be able to add a reducer', () => {
    const reducer = jest.fn();
    StoreManager.addReducer('test', reducer);
    expect(StoreManager.reducers).toHaveProperty('test', reducer);
  });

  it('should be able to remove a reducer', () => {
    StoreManager.reducers.test = jest.fn();
    StoreManager.removeReducer('test');
    expect(StoreManager.reducers.test).toBeUndefined();
  });

  it('should be able to remove all reducers', () => {
    StoreManager.addReducer('testA', jest.fn());
    StoreManager.addReducer('testB', jest.fn());
    StoreManager.removeAllReducers();
    expect(StoreManager.reducers).toEqual({});
  });

  it('should be able to create a valid root reducer', () => {
    const rootReducer = StoreManager.getRootReducer();
    const state = { $_foo: {} };
    const newState = rootReducer(state);
    expect(rootReducer).toBeInstanceOf(Function);
    expect(newState).toBe(state);
  });

  it('should call all added reducers when an action is dispatched', () => {
    const reducer = jest.fn();
    reducer.mockReturnValue({});
    StoreManager.addReducer('test', reducer);
    StoreManager.update();
    StoreManager.getInstance().dispatch({ type: 'FOO' });
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
    StoreManager.useMiddleware(middleware);
    StoreManager.buildInstance();
    StoreManager.getInstance().dispatch({ type: 'FOO' });
    expect(middleware).toHaveBeenCalled();
  });
});
