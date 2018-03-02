import { takeLatest, put, call } from 'redux-saga/effects';

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
  sagas = {};
  subReducers = {};
  initialState = {};

  getPrefix = () => `@@${this.name}/`

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
    this.sagas[actionType] = this.sagaForAction(actionType, argNames, callback);
  }

  handleAction = (name, callback = () => null) => {
    const argNames = helpers.getArgNames(callback);

    // register sub reducer
    this.subReducers[name] = this.subReducerForAction(name, argNames, callback);

    // register saga
    this.sagas[name] = this.sagaForAction(name, argNames, callback);
  }

  reducer = (state = this.initialState, action = {}) => {
    const actionType = (action.type.match(/@@(.*?)\/((.*?)(?=\/)|(.*?)$)/) || [])[0] || action.type;
    const subActionType = action.type.replace(actionType, '').slice(1);

    if (subActionType === 'UPDATE') {
      return this.mergeStates(state, action.payload || {});
    }

    if (typeof this.subReducers[actionType] !== 'undefined') {
      return this.subReducers[actionType](state, action);
    }

    return state;
  }

  subReducerForAction = (actionType, argNames, callback) => (state, action) => {
    if (action.type === actionType) {
      const stateFragment = this.executeCallback(action, callback, argNames);
      return this.mergeStates(state, stateFragment || {});
    }

    return state;
  }

  actionCreatorForAction = (actionType, argNames) => (...args) => {
    const payload = argNames.reduce((prev, next, index) => ({
      ...prev,
      [next]: args[index],
    }), {});
    const action = {
      type: actionType,
      payload,
    };

    return action;
  }

  sagaForAction = (actionType, argNames, callback) => function* saga() {
    yield takeLatest(actionType, function* sagaWorker(action) {
      const result = this.executeCallback(action, callback, argNames);

      if (result && typeof result[Symbol.iterator] === 'function') {
        try {
          let data;
          let isDone = false;
          let dieAfter = 50;

          while (!isDone) {
            const next = result.next(data);
            const nextResult = next.value;
            isDone = next.done;

            if (nextResult instanceof Promise) {
              data = yield call(() => nextResult);
            } else
            if (helpers.getObjectType(nextResult) === 'object') {
              yield put({
                type: `${action.type}/UPDATE`,
                payload: nextResult,
              });
            }

            dieAfter -= 1;

            if (dieAfter === 0) {
              throw new Error('An async action handler cannot yield more than 50 values.');
            }
          }

          yield put({
            type: `${action.type}/COMPLETE`,
          });
        } catch (e) {
          yield put({
            type: `${action.type}/ERROR`,
            message: e.message,
          });
        }
      }
    }.bind(this));
  }.bind(this)

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

  mergeStates = (stateA, stateB) => Object.keys(stateB).reduce(
    (prev, next) => helpers.findPropInObject(prev, next, stateB[next]),
    { ...stateA },
  )

  executeCallback = (action, callback, argNames) => callback.apply({
    getState: this.getState,
  }, argNames.map(arg => action.payload[arg]))

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
