/**
 * Dependency imports.
 */
import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose,
} from 'redux';

/**
 * Reference to hold the Redux store instance.
 * @type {Object}
 */
let storeInstance;

/**
 * This is not the actual store. This is a wrapper object that manages
 * the Redux store instance. Use `Store.getInstance()` to get a reference
 * to the Redux store.
 */
export const Store = {
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
  middleWares: [],

  /**
   * Registers a reducer function.
   * @param  {String}   key       Reducer unique identifier key.
   * @param  {Function} reducer   Reducer function.
   */
  addReducer(name, reducer) {
    Store.reducers[name] = reducer;
  },

  /**
   * Unregisters a reducer function.
   * @param  {String}   key   Reducer unique identifier key.
   */
  removeReducer(name) {
    delete Store.reducers[name];
  },

  /**
   * Unregisters all reducer functions.
   */
  removeAllReducers() {
    Object.keys(Store.reducers).forEach(name => Store.removeReducer(name));
  },

  /**
   * Combines all registered reducers and returns a single reducer function.
   * @return {Function} The root reducer function.
   */
  getRootReducer() {
    return combineReducers({
      $_foo: (state = {}) => state, // default reducer
      ...Store.reducers,
    });
  },

  /**
   * Returns an reference to the Redux store instance.
   * @return {Object} Reference to the store instance.
   */
  getInstance() {
    if (!storeInstance) {
      Store.buildInstance();
    }

    return storeInstance;
  },

  /**
   * Creates a new Redux store instance and updates the reference.
   */
  buildInstance() {
    storeInstance = createStore(
      Store.getRootReducer(),
      compose(...Store.middleWares),
    );
  },

  /**
   * Updates the root reducer of the store. Call this method after adding or
   * removing reducers.
   */
  update() {
    return storeInstance.replaceReducer(Store.getRootReducer());
  },

  /**
   * Allows registering middleware functions such as Router and other middlewares.
   * @param {Function} middleWare Middleware function to use
   */
  useMiddleware(middleWare) {
    return Store.middleWares.unshift(applyMiddleware(middleWare));
  },
};

/**
 * Default export.
 */
export default Store.getInstance();
