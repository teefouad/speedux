/**
 * Dependency imports.
 */
import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose,
} from 'redux';

import createSagaMiddleware from 'redux-saga';

/**
 * Creates the saga middleware function.
 * @type {Function}
 */
const sagaMiddleware = createSagaMiddleware();

/**
 * Creates a middleware function that is used to enable Redux devTools.
 * in the browser.
 * @type {Function}
 */
const devTools = compose(window.devToolsExtension ? window.devToolsExtension() : foo => foo);

/**
 * Reference to hold the Redux store instance.
 * @type {Object}
 */
let storeInstance;

/**
 * This is not the actual store. This is a wrapper object that manages
 * the Redux store instance. Use `StoreManager.getInstance()` to get a reference
 * to the Redux store.
 */
export const StoreManager = {
  /**
   * An object that is used as a map to store references to registered
   * reducers. This object is used by `getRootReducer` to create the
   * root reducer for the store.
   * @type {Object}
   */
  reducers: {},

  /**
   * An array of middlewares to use when creating the store.
   * Use `useMiddleware` method to add other middleware functions to this list.
   * @type {Array}
   */
  middleWares: [applyMiddleware(sagaMiddleware), devTools],

  /**
   * Registers a reducer function.
   * @param  {String}   key       Reducer unique identifier key.
   * @param  {Function} reducer   Reducer function.
   */
  addReducer(name, reducer) {
    StoreManager.reducers[name] = reducer;
    StoreManager.update();
  },

  /**
   * Unregisters a reducer function. If you remove a reducer, you have to explicitly
   * call StoreManager.update() afterwars.
   * @param  {String}   key   Reducer unique identifier key.
   */
  removeReducer(name) {
    delete StoreManager.reducers[name];
  },

  /**
   * Unregisters all reducer functions.
   */
  removeAllReducers() {
    Object.keys(StoreManager.reducers).forEach(name => StoreManager.removeReducer(name));
  },

  /**
   * Combines all registered reducers and returns a single reducer function.
   * @return {Function} The root reducer function.
   */
  getRootReducer() {
    const reducers = { ...StoreManager.reducers };

    if (Object.keys(reducers).length === 0 || process.env.NODE_ENV === 'jest') {
      reducers.$_foo = (state = {}) => state; // default reducer
    }

    return combineReducers(reducers);
  },

  /**
   * Returns an reference to the Redux store instance.
   * @return {Object} Reference to the store instance.
   */
  getInstance() {
    if (!storeInstance) {
      StoreManager.buildInstance();
    }

    return storeInstance;
  },

  /**
   * Creates a new Redux store instance and updates the reference.
   */
  buildInstance() {
    storeInstance = createStore(
      StoreManager.getRootReducer(),
      compose(...StoreManager.middleWares),
    );
  },

  /**
   * Updates the root reducer of the store. Call this method after adding or
   * removing reducers.
   */
  update() {
    return storeInstance.replaceReducer(StoreManager.getRootReducer());
  },

  /**
   * Allows registering middleware functions such as Router and other middlewares.
   * @param {Function} middleWare Middleware function to use
   */
  useMiddleware(middleWare) {
    return StoreManager.middleWares.unshift(applyMiddleware(middleWare));
  },

  /**
   * Runs a saga generator function.
   * @param {Generator} saga Saga to run.
   */
  runSaga(saga) {
    sagaMiddleware.run(saga);
  },
};

/**
 * Default export.
 */
export default StoreManager.getInstance();
