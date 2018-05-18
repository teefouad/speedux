/**
 * Dependency imports.
 */
import {
  takeLatest,
  put,
  call,
} from 'redux-saga/effects';

/**
 * Local imports.
 */
import * as helpers from './helpers';

/**
 * Class definition.
 */
export default class Module {
  constructor(options = {}) {
    this.config(options);
  }

  static defaults = {
    // unique identifier key for the module
    name: '',
    // namespace to use when passing state keys as props
    stateKey: 'state',
    // namespace to use when passing action creators as props
    actionsKey: 'actions',
    // reference to the store object, mainly used to retrieve the state
    store: null,
    // hashmap of the module actions (each action is a normal or a generator function)
    actions: {},
    // hashmap of handler functions, use the action type as the key or the function name
    // and a reference to the handler function as the value
    handlers: {},
    // initial state object of the module
    initialState: {},
  };

  // a hashmap of all the action types for the module with the name as the key
  // and the prefixed type as the value
  types = {};
  // a hashmap of all the action creator functions for the module with the action
  // name in camelCase as the key and the action creator function as the value
  actionCreators = {};
  // a hashmap of sub reducer functions, for each registered action
  // the main reducer function of the module will check this hash table whenever
  // it is called with an action to allow each sub reducer to process the action
  reducers = {};
  // a hashmap of all the saga generator functions for the module with the action
  // type as the key and the generator function as the value
  sagas = {};
  // a hashmap of all the assigned saga workers with the action type as the key and
  // the generator function as the value
  workerSagas = {};

  /**
   * Configures the module with a configuration object
   */
  config = (options) => {
    const config = {
      ...Module.defaults,
      ...this.currentConfig,
      ...options,
    };

    this.name = config.name;
    this.stateKey = config.stateKey;
    this.actionsKey = config.actionsKey;
    this.store = config.store;
    this.initialState = helpers.deepCopy(config.state || config.initialState);
    this.actions = {};
    this.handlers = {};
    this.currentConfig = helpers.deepCopy(config);

    Object.keys(config.actions).forEach((action) => {
      this.actions[action] = config.actions[action].bind(this.getCallbackContext());
    });

    Object.keys(config.handlers).forEach((handler) => {
      this.handlers[handler] = config.handlers[handler].bind(this.getCallbackContext());
    });

    this.createSubReducers();
  }

  /**
   * Returns the module prefix. This is mainly used to prefix action types to allow
   * using the same action name with different modules without conflicting each other.
   */
  getPrefix = () => {
    if (this.name) {
      return `@@${this.name}/`;
    }

    return '';
  }

  /**
   * Sets the module name.
   */
  setName = (newName) => {
    this.name = newName;
    this.types = {};
    this.actionCreators = {};
    this.reducers = {};
    this.sagas = {};
    this.workerSagas = {};

    this.createSubReducers();
  }

  /**
   * Creates the action creator functions, the sagas, the main reducer function and registers
   * the action type string.
   * @param {String}    name        An uppercase snake_case string that represents the action
   *                                name. For example 'ADD_COUNT' or 'CHANGE_USER_EMAIL'. You can
   *                                use camelCase or include spaces, dashes and underscore as well.
   * @param {Function}  callback    A function that returns an object. The returned object
   *                                represents a state fragment which is used to update the
   *                                state object. For asyncronous actions, use a generator
   *                                function to yield multiple times.
   */
  createAction = (name, callback = () => null) => {
    const camelCaseName = helpers.toCamelCase(name);
    const actionName = helpers.toSnakeCase(camelCaseName).toUpperCase();
    const actionType = `${this.getPrefix()}${actionName}`;
    const argNames = helpers.getArgNames(callback);

    // register type
    this.types[actionName] = actionType;

    // build the action creator function
    this.actionCreators[camelCaseName] = (...args) => {
      // build the payload object
      const payload = argNames.reduce((prev, next, index) => ({
        ...prev,
        [next]: args[index],
      }), {});

      // then use it to build the action object
      const actionObject = {
        type: actionType,
        payload,
      };

      return actionObject;
    };

    // build the reducer function
    this.reducers[actionType] = this.createSubReducer(actionType, callback, argNames, 'create');

    // build the saga handler
    this.sagas[actionType] = this.createSaga(actionType);
  }

  /**
   * Creates a sub reducer function to handle the provided action type.
   * @param {String}    actionType  Action type to handle.
   * @param {Function}  callback    A function that returns an object. The returned object
   *                                represents a state fragment which is used to update the
   *                                state object. For asyncronous actions, use a generator
   *                                function to yield multiple times.
   */
  handleAction = (actionType, callback = () => null) => {
    const argNames = helpers.getArgNames(callback);

    // build the reducer function
    this.reducers[actionType] = this.createSubReducer(actionType, callback, argNames, 'handle');

    // build the saga handler
    this.sagas[actionType] = this.createSaga(actionType);
  }

  /**
   * Create all sub reducers for the module.
   */
  createSubReducers = () => {
    Object.entries(this.currentConfig.actions).forEach(([actionName, actionCallback]) => {
      this.createAction(actionName, actionCallback);
    });

    Object.entries(this.currentConfig.handlers).forEach(([actionType, handlerCallback]) => {
      this.handleAction(actionType, handlerCallback);
    });
  }

  /**
   * The main reducer function for the module.
   */
  reducer = (state = this.initialState, action = { type: '' }) => {
    // the action type might be in normal form, such as: '@@prefix/ACTION_NAME'
    // or it may contain a sub action type: '@@prefix/ACTION_NAME/SUB_ACTION_NAME'
    const actionType = action.type;
    const mainActionType = (actionType.match(/@@(.*?)\/((.*?)(?=\/)|(.*?)$)/) || [])[0] || actionType;
    const subActionType = actionType.replace(mainActionType, '').slice(1);
    const actionName = this.ownsAction(mainActionType) ? mainActionType.replace(/^@@(.*?)\//, '') : 'HANDLE_ACTION';

    // if the sub action is 'update', just update the state with the payload object
    if (mainActionType === `${this.getPrefix()}${actionName}` && subActionType === 'UPDATE') {
      return this.mergeStates(state, action.payload || {});
    }

    // if it's a main action, look for a sub reducer that can handle this action
    if (typeof this.reducers[mainActionType] !== 'undefined') {
      return this.reducers[mainActionType](state, action);
    }

    // if it's an irrelevant action, just return the state
    return state;
  }

  /**
   * Creates and returns a sub reducer function for a given action type.
   */
  createSubReducer = (actionType, callback, argNames, mode) => (state, action) => {
    if (action.type === actionType) {
      const result = this.executeCallback(action, callback, argNames, mode);
      const resultType = helpers.getObjectType(result);
      const stateFragment = (resultType === 'object' ? result : {});

      // the saga handler will be called right after the reducer so instead of the saga
      // handler executing the callback again, pass it the cached result
      this.$cachedCallbackResult = this.$cachedCallbackResult || {};
      this.$cachedCallbackResult[actionType] = result;

      return this.mergeStates(state, stateFragment);
    }

    return state;
  }

  /**
   * Creates and returns a saga generator function for a given action type.
   */
  createSaga = actionType => function* saga() {
    this.workerSagas[actionType] = this.createWorkerSaga(actionType);
    yield takeLatest(actionType, this.workerSagas[actionType]);
  }.bind(this)

  /**
   * Creates and returns a worker saga generator function for a given action type.
   */
  createWorkerSaga = actionType => function* workerSaga(action) {
    const result = this.$cachedCallbackResult[actionType];
    const actionName = this.ownsAction(action.type) ? action.type.replace(/^@@(.*?)\//, '') : 'HANDLE_ACTION';

    // check if the callback return value is an iterable (usually a generator function)
    // if it is an iterable then consume it
    if (result && typeof result[Symbol.iterator] === 'function') {
      try {
        // `data` will be assigned to each `next()` call
        let data;
        // `isDone` will be true when `next()` returns done as true
        let isDone = false;
        // the while loop will break after a maximum of 50 calls
        let breakAfter = 50;

        while (!isDone) {
          const next = result.next(data);
          const nextResult = next.value;

          isDone = next.done;

          // if the yielded value is a Promise, resolve it then continue
          if (nextResult instanceof Promise) {
            data = yield call(() => nextResult);
          } else
          // if the yielded value is an object, use it to update the state
          if (helpers.getObjectType(nextResult) === 'object') {
            yield put({
              type: `${this.getPrefix()}${actionName}/UPDATE`,
              payload: nextResult,
            });
          }

          breakAfter -= 1;

          // safety break
          if (breakAfter === 0) {
            throw new Error('An async action handler yielded more than 50 values.');
          }
        }

        // indicate that the async action has completed by dispatching
        // a COMPLETE sub action
        yield put({
          type: `${this.getPrefix()}${actionName}/COMPLETE`,
        });
      } catch (e) {
        window.console.error(e);

        yield put({
          type: `${this.getPrefix()}${actionName}/ERROR`,
          message: e.message,
        });
      }
    }
  }.bind(this)

  /**
   * Returns the component state object or part of it based on a given query. If the
   * query parameter is a string that uses dot notation, it will return the resolved
   * value of the given key. If the query is an object, it will return an object that
   * has the same structure but contains the resolved values. If the query parameter
   * is not provided, the complete state object will be returned.
   * @param {String|Object}   query   A query string or a query object that represents
   *                                  part of the state object that needs to be fetched.
   *                                  This parameter is not required.
   */
  getState = (query) => {
    const state = this.store.getState()[this.name];

    // handle query strings
    if (helpers.getObjectType(query) === 'string') {
      return helpers.findPropInObject(state, query);
    }

    // handle query objects
    if (helpers.getObjectType(query) === 'object') {
      return Object.keys(query).reduce((prev, next) => ({
        ...prev,
        [next]: helpers.findPropInObject(state, query[next]),
      }), {});
    }

    return state;
  }

  /**
   * Executes a given callback function and passes it getState in the context.
   */
  executeCallback = (action, callback, argNames, mode = 'create') => {
    const callbackArgs = mode === 'create' ? argNames.map(arg => action.payload[arg]) : [action];

    return callback.apply(this.getCallbackContext(), callbackArgs);
  }

  /**
   * Merges two state objects and returns the merged object as a new copy.
   */
  mergeStates = (stateA, stateB) => Object.keys(stateB).reduce(
    (prev, next) => helpers.findPropInObject(prev, next, false, stateB[next]),
    { ...stateA },
  )

  /**
   * Checks whether the module owns (has created) the provided action type.
   */
  ownsAction = actionType => Object.values(this.types).includes(actionType)

  /**
   * Returns the context used for a callback (action or handler)
   */
  getCallbackContext = () => ({
    getState: this.getState,
    get state() { return this.getState(); },
  })
}
