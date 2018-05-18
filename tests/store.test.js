import storeInstance, {
  StoreManager,
  sagaEnhancer,
  devTools,
} from '../src/store';

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

  it('should have an empty reducers hash table by default', () => {
    expect(StoreManager.reducers).toEqual({});
  });

  it('should have default middlewares', () => {
    expect(StoreManager.middleWares).toMatchObject([sagaEnhancer, devTools]);
  });

  it('should be able to add a reducer', () => {
    const reducer = (state = {}) => state;
    StoreManager.addReducer('test', reducer);
    expect(StoreManager.reducers).toHaveProperty('test', reducer);
  });

  it('should be able to remove a reducer', () => {
    StoreManager.reducers.test = (state = {}) => state;
    StoreManager.removeReducer('test');
    expect(StoreManager.reducers.test).toBeUndefined();
  });

  it('should be able to remove all reducers', () => {
    StoreManager.addReducer('testA', (state = {}) => state);
    StoreManager.addReducer('testB', (state = {}) => state);
    StoreManager.removeAllReducers();
    expect(StoreManager.reducers).toEqual({});
  });

  it('should be able to return a root reducer function', () => {
    const rootReducer = StoreManager.getRootReducer();
    expect(rootReducer).toBeInstanceOf(Function);
  });

  it('should be able to create a valid root reducer', () => {
    const rootReducer = StoreManager.getRootReducer();
    const state = { $_foo: {} };
    const newState = rootReducer(state);
    expect(newState).toBe(state);
  });

  it('should call added reducers when an action is dispatched', () => {
    const reducer = jest.fn((state = {}) => state);
    StoreManager.addReducer('test', reducer);
    StoreManager.getInstance().dispatch({ type: 'FOO' });
    expect(reducer).toHaveBeenCalledWith({}, { type: 'FOO' });
  });

  it('should be able to run a given saga', () => {
    const saga = jest.fn(function* testSaga() { yield null; });
    StoreManager.runSaga(saga);
    StoreManager.getInstance().dispatch({ type: 'FOO' });
    expect(saga).toHaveBeenCalled();
  });

  it('should export a store instance by default', () => {
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
