/**
 * Dependency imports.
 */
import {
  createStore as createReduxStore,
  applyMiddleware,
  compose,
  combineReducers,
} from 'redux';
import createSagaMiddleware from 'redux-saga';

/**
 * Local imports.
 */
import * as helpers from './helpers';

/**
 * This is not the actual store object. This is a wrapper object
 * that manages the Redux store instance. Use `store.getInstance()`
 * to get a reference to the Redux store.
 */
const store = {
  /**
   * An object that is used as a map to store references to registered
   * reducers. This object is used by `getRootReducer()` to create the
   * root reducer for the store.
   * @type {Object}
   */
  reducers: {},

  /**
   * An array that holds saga functions to be run
   */
  sagas: [],

  /**
   * An array of middlewares to use when creating the store.
   * Use exported method `useMiddleware()` to add other middleware
   * functions to this list.
   * @type {Array}
   */
  middlewares: [],

  /**
   * An object that is used to build the initial state tree for the
   * entire app. Each call to `connect()` will add a new key to this
   * object.
   * @type {Object}
   */
  combinedInitialState: {},

  /**
   * Creates a new Redux store instance and updates the reference.
   */
  create() {
    if (this.storeInstance) return this.storeInstance;
    return this.buildInstance();
  },

  /**
   * Builds a Redux store instance.
   */
  buildInstance() {
    /* eslint-disable */
    const devToolsExtension = (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__)
      ? window.__REDUX_DEVTOOLS_EXTENSION__()
      : foo => foo;
    /* eslint-enable */

    this.sagaMiddleware = createSagaMiddleware();
    this.sagaEnhancer = applyMiddleware(this.sagaMiddleware);
    this.devTools = this.devTools || compose(devToolsExtension);

    this.storeInstance = createReduxStore(
      this.getRootReducer(),
      compose(...this.middlewares, this.sagaEnhancer, this.devTools),
    );

    this.sagas.forEach(saga => this.sagaMiddleware.run(saga));

    return this.storeInstance;
  },

  /**
   * Returns the root reducer function.
   */
  getRootReducer() {
    if (this.rootReducer) return this.rootReducer;
    return this.buildRootReducer();
  },

  /**
   * Combines all registered reducers and returns a single reducer
   * function.
   */
  buildRootReducer() {
    const reducers = { ...this.reducers };

    if (Object.keys(reducers).length === 0) {
      reducers.$_foo = (state = {}) => state; // default reducer
    }

    const combinedReducers = combineReducers(reducers);

    this.rootReducer = (state = this.combinedInitialState, action = null) => {
      // cache the state
      this.cachedState = state;

      // get the new state object
      const newState = combinedReducers(state, action);

      // update cached state
      this.cachedState = newState;

      // return the new state
      return newState;
    };

    return this.rootReducer;
  },

  /**
   * Updates the root reducer of the store.
   */
  update() {
    return this.storeInstance.replaceReducer(this.buildRootReducer());
  },

  /**
   * Registers a reducer function.
   * @param  {String}   key             Reducer unique identifier key
   * @param  {Function} reducer         Reducer function
   * @param  {Object}   initialState    Optional initial state for the reducer
   */
  useReducer(name, reducer, initialState) {
    this.reducers[name] = reducer;
    this.combinedInitialState[name] = initialState;
  },

  /**
   * Unregisters all reducer functions.
   */
  resetReducers() {
    this.reducers = {};
    this.combinedInitialState = {};
  },

  /**
   * Allows registering middleware functions such as Router and other middlewares.
   * @param {Function} middleware Middleware function to use
   */
  useMiddleware(middleware) {
    this.middlewares.unshift(applyMiddleware(middleware));
  },

  /**
   * Removes all registered middlewares.
   */
  resetMiddlewares() {
    this.middlewares = [];
  },

  /**
   * Allows registering saga functions.
   * @param {Function} saga Saga function to be run
   */
  useSaga(saga) {
    this.sagas.push(saga);
  },

  /**
   * Removes all registered sagas.
   */
  resetSagas() {
    this.sagas = [];
  },

  /**
   * Resets the store and deletes the instance.
   */
  reset() {
    this.resetReducers();
    this.resetMiddlewares();
    this.resetSagas();
    delete this.rootReducer;
    delete this.storeInstance;
  },

  /**
   * Returns the complete state object or part of it based on a given query. If the
   * query parameter is a string that uses dot notation, it will return the resolved
   * value of the given key. If the query is an object, it will return an object that
   * has the same structure but contains the resolved values. If the query parameter
   * is not provided, the complete state object will be returned.
   * @param   {String|Object}   query   A query string or a query object that represents
   *                                    part of the state object that needs to be fetched.
   *                                    This parameter is not required.
   */
  getState(query) {
    return helpers.queryState(query, this.storeInstance.getState());
  },

  /**
   * Returns an reference to the Redux store instance.
   */
  getInstance() {
    return this.storeInstance;
  },
};

export default store;
