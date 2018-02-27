import * as helpers from './helpers';

class Module {
  constructor(name, initialState = {}, store = null) {
    this.name = name;
    this.stateKey = name;
    this.actionsKey = name;
    this.store = store;
    this.initialState = { ...initialState };
  }

  name = null;
  store = null;
  stateKey = null;
  actionsKey = null;
  types = {};
  actions = {};
  subReducers = {};
  stateFragments = {};
  initialState = {};
  currentAction = {};

  getPrefix = () => `@@${this.name}/`

  setState = (stateFragment, action = null) => {
    const currentAction = action || this.currentAction;

    this.stateFragments[currentAction.type] = {
      ...this.stateFragments[currentAction.type],
      ...stateFragment,
    };

    if (currentAction.async === true) {
      this.store.dispatch(currentAction);
    }
  }

  getState = (query, action = null) => {
    const currentAction = action || this.currentAction;
    const stateFragment = this.stateFragments[currentAction.type] || {};
    const state = this.store.getState()[this.name];
    const mergedState = this.mergeStates(state, stateFragment);

    // handle query strings
    if (helpers.getObjectType(query) === 'string') {
      return helpers.findPropInObject(mergedState, query);
    }

    // handle query objects
    if (helpers.getObjectType(query) === 'object') {
      return Object.keys(query).reduce((prev, next) => ({
        ...prev,
        [next]: helpers.findPropInObject(mergedState, query[next]),
      }), {});
    }

    return mergedState;
  }

  mergeStates = (stateA, stateB) => Object.keys(stateB).reduce(
    (prev, next) => helpers.findPropInObject(prev, next, stateB[next]),
    { ...stateA },
  )

  reducer = (state = this.initialState, action = {}) => {
    if (typeof this.subReducers[action.type] !== 'undefined') {
      return this.subReducers[action.type](state, action);
    }

    return state;
  }

  createAction = (name, callback = () => null) => {
    const prefix = this.getPrefix();
    const actionName = Module.getSnakeCaseName(name);
    const actionType = `${prefix}${actionName}`;
    const actionCreatorName = Module.getCamelCaseName(name);

    this.types[actionName] = actionType;

    this.actions[actionCreatorName] = (...args) => {
      // reset current action object for syncronous actions
      this.currentAction = {};

      const argNames = helpers.getArgNames(callback);
      const payload = argNames.reduce((prev, next, index) => ({
        ...prev,
        [next]: args[index],
      }), {});
      const action = {
        type: actionType,
        payload,
      };

      const result = this.executeCallback(callback, action, argNames);

      // check if the callback return value is an iterable (usually a generator function)
      // if it is an iterable then return a thunk instead of the action object and consume
      // the generator function
      if (result && typeof result[Symbol.iterator] === 'function') {
        return (dispatch) => {
          this.currentAction = {
            ...action,
            async: true,
          };

          dispatch(this.currentAction);

          // recursively consume the generator function, `iterable` is the iterable object and
          // `data` is the data resolved from a promise (if any)
          (function consumeIterable(iterable, data) {
            const next = iterable.next(data);

            // if the generator yields a promise, wait for the promise to resolve before making
            // the next call
            if (next.value instanceof Promise) {
              next.value.then((promiseResult) => {
                consumeIterable(iterable, promiseResult);
              });
            } else if (!next.done) {
              // get the next value, if there is one
              consumeIterable(iterable, next.value);
            }
          }(result));
        };
      }

      return action;
    };

    this.subReducers[actionType] = (state, action) => {
      if (action.type === actionType) {
        return this.mergeStates(state, this.stateFragments[action.type] || {});
      }

      return state;
    };
  }

  handleAction = (name, callback = () => null) => {
    const argNames = helpers.getArgNames(callback);
    this.subReducers[name] = (state, action) => {
      this.executeCallback(callback, action, argNames);
      return this.mergeStates(state, this.stateFragments[action.type] || {});
    };
  }

  executeCallback = (callback, action, argNames) => {
    this.stateFragments = {};
    this.currentAction = action;
    return callback.apply(this, argNames.map(arg => action.payload[arg]));
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
