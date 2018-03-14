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

class Module {
  constructor(name, initialState = {}, store = null) {
    this.name = name;
    this.stateKey = name;
    this.actionsKey = name;
    this.store = store;
    this.initialState = { ...initialState };
  }

  // unique identifier key for the module
  name = null;
  // reference to the store object, used to retrieve the state
  store = null;
  // namespace to use when passing state keys as props
  stateKey = null;
  // namespace to use when passing action creators as props
  actionsKey = null;
  // a hashmap of all the action types for the module with the name as the key
  // and the prefixed type as the value
  types = {};
  // a hashmap of all the action creator functions for the module with the action
  // name in camelCase as the key and the action creator function as the value
  actions = {};
  // a hashmap of all the action dispatchers for the module with the action
  // name in camelCase as the key and the action dispatcher function as the value
  dispatch = {};
  // a hashmap of all the saga generator functions for the module with the action
  // name in camelCase as the key and the generator function as the value
  sagas = {};
  // a hashmap of sub reducer functions, one for each registered action
  // the main reducer function of the module will check this hash table whenever
  // it is called with an action to allow each sub reducer to process the action
  subReducers = {};
  // the initial state object for the module
  initialState = {};

  /**
   * Returns the module prefix. This is mainly used to prefix action types to allow
   * using the same action name with different modules without conflicting each other.
   */
  getPrefix = () => `@@${this.name}/`

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
    const actionName = Module.getSnakeCaseName(name);
    const actionType = `${this.getPrefix()}${actionName}`;
    const actionCreatorName = Module.getCamelCaseName(name);
    const argNames = helpers.getArgNames(callback);

    // register type
    this.types[actionName] = actionType;

    // register sub reducer
    this.subReducers[actionType] = this.subReducerForAction(actionType, argNames, callback);

    // register action creator
    this.actions[actionCreatorName] = this.actionCreatorForAction(actionType, argNames);

    // register saga
    this.sagas[actionCreatorName] = this.sagaForAction(actionType);

    // register a dispatcher
    this.dispatch[actionCreatorName] = (...args) =>
      this.store.dispatch(this.actions[actionCreatorName](...args));
  }

  /**
   * Creates a sub reducer to handle the provided action type.
   * @param {String}    type        Action type to handle.
   * @param {Function}  callback    A function that returns an object. The returned object
   *                                represents a state fragment which is used to update the
   *                                state object. For asyncronous actions, use a generator
   *                                function to yield multiple times.
   */
  handleAction = (type, callback = () => null) => {
    const argNames = helpers.getArgNames(callback);

    // register sub reducer
    this.subReducers[type] = this.subReducerForAction(type, argNames, callback, 'handle');

    // register saga
    this.sagas[type] = this.sagaForAction(type);
  }

  /**
   * The main reducer function for the module.
   */
  reducer = (state = this.initialState, action = {}) => {
    // the action type might be in normal form, such as: '@@prefix/ACTION_NAME'
    // or it may contain a sub action type: '@@prefix/ACTION_NAME/SUB_ACTION_NAME'
    const actionType = action.type || '';
    const mainActionType = (actionType.match(/@@(.*?)\/((.*?)(?=\/)|(.*?)$)/) || [])[0] || actionType;
    const subActionType = actionType.replace(mainActionType, '').slice(1);

    // if the sub action is 'update', just update the state with the payload object
    if (subActionType === 'UPDATE') {
      return this.mergeStates(state, action.payload || {});
    }

    // if it's a main action, look for a sub reducer that can handle this action
    if (typeof this.subReducers[mainActionType] !== 'undefined') {
      return this.subReducers[mainActionType](state, action);
    }

    // if it's an irrelevant action, just return the state
    return state;
  }

  /**
   * Creates and returns a sub reducer function for a given action type.
   */
  subReducerForAction = (actionType, argNames, callback, mode = 'create') => (state, action) => {
    if (action.type === actionType) {
      const result = this.executeCallback(action, callback, argNames, mode);
      const resultType = helpers.getObjectType(result);
      const stateFragment = resultType === 'object' ? result : {};

      // the saga handler will be called right after the reducer so instead of the saga
      // handler executing the callback again, pass it the cached result
      this.$cachedCallbackResultForSaga = this.$cachedCallbackResultForSaga || {};
      this.$cachedCallbackResultForSaga[actionType] = result;

      return this.mergeStates(state, stateFragment);
    }

    return state;
  }

  /**
   * Creates and returns an action creator function for a given action type.
   */
  actionCreatorForAction = (actionType, argNames) => (...args) => {
    // build the payload object
    const payload = argNames.reduce((prev, next, index) => ({
      ...prev,
      [next]: args[index],
    }), {});

    // then use it to build the action object
    const action = {
      type: actionType,
      payload,
    };

    return action;
  }

  /**
   * Creates and returns a saga generator function for a given action type.
   */
  sagaForAction = actionType => function* saga() {
    yield takeLatest(actionType, function* sagaWorker(action) {
      const result = this.$cachedCallbackResultForSaga[actionType];

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
                type: `${action.type}/UPDATE`,
                payload: nextResult,
              });
            }

            breakAfter -= 1;

            // safety break
            if (breakAfter === 0) {
              throw new Error('An async action handler cannot yield more than 50 values.');
            }
          }

          // indicate that the async action has completed by dispatching
          // a COMPLETE sub action
          yield put({
            type: `${action.type}/COMPLETE`,
          });
        } catch (e) {
          window.console.error(e);

          yield put({
            type: `${action.type}/ERROR`,
            message: e.message,
          });
        }
      }
    }.bind(this));
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
   * Merges two state objects and returns the merged object as a new copy.
   */
  mergeStates = (stateA, stateB) => Object.keys(stateB).reduce(
    (prev, next) => helpers.findPropInObject(prev, next, false, stateB[next]),
    { ...stateA },
  )

  /**
   * Executes a given callback function and passes it getState in the context.
   */
  executeCallback = (action, callback, argNames, mode = 'create') => {
    const callbackArgs = mode === 'create' ? argNames.map(arg => action.payload[arg]) : [action];

    return callback.apply({
      getState: this.getState,
      get state() { return this.getState(); },
    }, callbackArgs);
  }

  static getCamelCaseName = (name) => {
    const cleanName = name.replace(/[^\w\s_-]/g, '');

    // if it's in snakecase, convert it to camelcase
    if (/(.*?)[-_\s]/.test(cleanName)) {
      return cleanName.toLowerCase().replace(/[-_\s]\w/g, w => w[1].toUpperCase());
    } else
    // if it's already in camelcase, return it
    if (/([a-z][A-Z])+/.test(cleanName)) {
      return cleanName;
    }

    return cleanName.toLowerCase();
  }

  static getSnakeCaseName = (name) => {
    const camelCaseName = Module.getCamelCaseName(name);
    const snakeCaseName = camelCaseName.replace(/[A-Z]/g, w => `_${w}`);
    return snakeCaseName.toUpperCase();
  }
}

export default Module;
