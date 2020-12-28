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
import { all, call, takeEvery } from 'redux-saga/effects';

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
   * An object that holds saga functions to be run
   */
  sagas: {},

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

    function* rootSaga(action) {
      const filteredSagas = Object.keys(store.sagas)
        .filter((key) => {
          const actionType = key.replace(/^(create:|handle:)/, '');
          return actionType === action.type;
        })
        .map(key => call(store.sagas[key], action));

      yield all(filteredSagas);
    }

    function* rootSagaWorker() {
      yield takeEvery('*', rootSaga);
    }

    this.sagaMiddleware.run(rootSagaWorker);

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
   * @param {String}    actionType  Action type to assign the saga to
   * @param {Function}  saga        Saga function to be run
   */
  useSaga(actionType, saga) {
    this.sagas[actionType] = saga;
  },

  /**
   * Registers a list of saga functions.
   * @param {Object} sagas A list of saga functions to be run
   */
  useSagas(sagas) {
    Object.keys(sagas).forEach(actionType => this.useSaga(actionType, sagas[actionType]));
  },

  /**
   * Removes all registered sagas.
   */
  resetSagas() {
    this.sagas = {};
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
    delete this.registeredNames;
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

  /**
   * Registers a module name. The registered name must be unique for each component.
   * @param {String} name Name to register
   */
  registerName(name) {
    if (typeof this.registeredNames === 'undefined') {
      this.registeredNames = {};
    }

    if (this.registeredNames[name] === true) {
      const { warn } = console;
      warn(`Duplicate name: ${name}. This name has already been used to connect another component, please use a different name.`);
    } else {
      store.registeredNames[name] = true;
    }
  },
};

export default store;
