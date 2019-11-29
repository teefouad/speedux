/**
 * Dependency imports.
 */
import { bindActionCreators } from 'redux';
import {
  takeEvery,
  put,
  call,
} from 'redux-saga/effects';

/**
 * Local imports.
 */
import store from './store';
import dispatch from './dispatch';
import * as helpers from './helpers';

const META_SYMBOL = Symbol('@@speedux/META');

class Module {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.stateKey = config.stateKey || 'state';
    this.actionsKey = config.actionsKey || 'actions';
    this.dispatchKey = config.dispatchKey || 'dispatch';
    this.globalStateKey = config.globalStateKey || 'globalState';
    this.actionCreators = {};
    this.actionToReducerMap = {};
    this.handlerToReducerMap = {};
    this.sagas = {};
    this.workerSagas = {};
    this.reducer = state => state;
    this.build();
  }

  build = () => {
    /* build action creators ---------- */
    Object.entries(this.config.actions || {}).forEach(([name, callback]) => {
      const camelCaseName = helpers.toCamelCase(name);
      const actionName = helpers.toSnakeCase(camelCaseName).toUpperCase();
      const actionType = `@@${this.name}/${actionName}`;
      const argNames = helpers.getArgNames(callback);

      if (callback.toString().includes('undefined.getState(')) {
        throw new Error(`Action '${this.name}.${name}' cannot call 'this.getState()'. Try using a normal function instead of an arrow function.`);
      }

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

      this.actionToReducerMap[actionType] = this.createSubReducer(actionType, callback, argNames, 'create');
      this.sagas[`create:${actionType}`] = this.createSaga(actionType, 'create');
    });

    /* build handlers ----------------- */
    Object.entries(this.config.handlers || {}).forEach(([name, callback]) => {
      let actionType = name;
      const argNames = helpers.getArgNames(callback);

      if (callback.toString().includes('undefined.getState(')) {
        throw new Error(`Action '${this.name}.${name}' cannot call 'this.getState()'. Try using a normal function instead of an arrow function.`);
      }

      if (/^(.*?)\.(.*?)$/.test(actionType)) {
        const [moduleName, camelCaseName] = actionType.split('.');
        const actionName = helpers.toSnakeCase(camelCaseName).toUpperCase();
        actionType = `@@${moduleName === 'this' ? this.name : moduleName}/${actionName}`;
      }

      this.handlerToReducerMap[actionType] = this.createSubReducer(actionType, callback, argNames, 'handle');
      this.sagas[`handle:${actionType}`] = this.createSaga(actionType, 'handle');
    });

    /* build reducer ------------------ */
    this.reducer = (state = {}, action) => {
      // the action type might be in normal form, such as: '@@prefix/ACTION_NAME'
      // or it may contain a sub action type: '@@prefix/ACTION_NAME/SUB_ACTION_NAME'
      const actionType = action.type;
      const mainActionType = (actionType.match(/@@(.*?)\/((.*?)(?=\/)|(.*?)$)/) || [])[0] || actionType;
      const subActionType = actionType.replace(mainActionType, '').slice(1);

      this.cachedState = state;

      // look for a sub reducer that can handle this action
      this.getActionTypeMatchers(action.type).forEach((matcher) => {
        if (this.actionToReducerMap[matcher]) {
          this.cachedState = this.actionToReducerMap[matcher](this.cachedState, action);
        } else if (
          this.actionToReducerMap[mainActionType]
          && subActionType === 'UPDATE'
          && action[META_SYMBOL] && action[META_SYMBOL].mode === 'create'
        ) {
          this.cachedState = helpers.mergeObjects(this.cachedState, action.payload || {});
        }

        if (this.handlerToReducerMap[matcher]) {
          this.cachedState = this.handlerToReducerMap[matcher](this.cachedState, action);
        } else if (
          this.handlerToReducerMap[mainActionType]
          && subActionType === 'UPDATE'
          && action[META_SYMBOL] && action[META_SYMBOL].mode === 'handle'
        ) {
          this.cachedState = helpers.mergeObjects(this.cachedState, action.payload || {});
        }
      });

      return this.cachedState;
    };

    /* map state to props ------------- */
    this.mapStateToProps = (state) => {
      const { [this.name]: ownState, ...otherStates } = state;

      const globalState = Object
        .entries(this.config.globalState || {})
        .reduce((p, [name, query]) => ({
          ...p,
          [name]: helpers.queryState(query, query === true ? otherStates[name] : otherStates),
        }), {});

      return {
        [this.stateKey]: ownState,
        [this.globalStateKey]: globalState,
      };
    };

    /* map dispatch to props ---------- */
    this.mapDispatchToProps = dispatchFunc => bindActionCreators(this.actionCreators, dispatchFunc);

    /* combine props ------------------ */
    this.combineProps = (stateProps, dispatchProps, ownProps) => ({
      ...ownProps,
      ...stateProps,
      [this.actionsKey]: { ...dispatchProps },
      [this.dispatchKey]: dispatch,
    });
  }

  createSubReducer = (actionType, callback, argNames, mode) => (state = {}, action = null) => {
    const callbackResult = this.executeCallback(callback, action, argNames, mode);
    const callbackResultType = helpers.getObjectType(callbackResult);
    const stateFragment = (callbackResultType === 'object' ? callbackResult : {});

    // the saga handler will be called right after the reducer so instead of the saga
    // handler executing the callback again, pass it the cached result
    this.cachedCallbackResult = this.cachedCallbackResult || {};
    this.cachedCallbackResult[`${mode}:${action.type}`] = callbackResult;

    return helpers.mergeObjects(state, stateFragment);
  };

  createSaga = (actionType, mode) => function* saga() {
    this.workerSagas[`${mode}:${actionType}`] = function* workerSaga(action) {
      const result = this.cachedCallbackResult && this.cachedCallbackResult[`${mode}:${actionType}`];

      // check if the callback return value is an iterable (usually a generator function)
      // if it is an iterable then consume it
      if (result && typeof result[Symbol.iterator] === 'function') {
        // `data` will be assigned to each `next()` call
        let data;
        // `isDone` will be true when `next()` returns done as true
        let isDone = false;
        // the while loop will break after a maximum of 1000 calls
        let breakAfter = 1000;

        while (!isDone) {
          this.cachedState = store.getState()[this.name];

          const next = result.next(data);
          const nextResult = next.value;

          isDone = next.done;

          // if the yielded value is a Promise, resolve it then continue
          if (nextResult instanceof Promise) {
            let error = false;

            data = yield call(() => nextResult.catch((e) => {
              error = e;
              return Promise.resolve(e);
            }));

            if (error) {
              yield put({
                type: `${action.type}/ERROR`,
                message: error.message,
              });
            }
          } else
          // if the yielded value is an object, use it to update the state
          if (helpers.getObjectType(nextResult) === 'object') {
            yield put({
              type: `${action.type}/UPDATE`,
              payload: nextResult,
              get [META_SYMBOL]() {
                return {
                  mode,
                  async: true,
                };
              },
            });
          }

          breakAfter -= 1;

          // safety break
          if (breakAfter === 0) {
            throw new Error('An async action or handler yielded more than 1000 values.');
          }
        }

        // indicate that the async action has completed by dispatching
        // a COMPLETE sub action
        yield put({
          type: `${action.type}/COMPLETE`,
        });
      }
    }.bind(this);

    yield takeEvery(actionType, this.workerSagas[`${mode}:${actionType}`]);
  }.bind(this);

  executeCallback = (callback, action, argNames, mode) => {
    const context = this.getCallbackContext();
    const callbackArgs = mode === 'create' ? argNames.map(arg => action.payload[arg]) : [action];
    return callback.apply(context, callbackArgs);
  }

  getCallbackContext = () => {
    const self = this;

    return {
      ...self.config.actions,
      getState: self.getState,
      getGlobalState: self.getGlobalState,
      isError: e => e instanceof Error,
    };
  }

  getState = query => helpers.queryState(query, this.cachedState)

  getGlobalState = (query) => {
    const globalState = { ...store.cachedState };
    delete globalState[this.name];
    return helpers.queryState(query, globalState);
  }

  getActionTypeMatchers = (actionType) => {
    const regex = /@@(.+?)\/(.+)/;
    let moduleName = '';
    let actionName = actionType;

    if (regex.test(actionType)) {
      [, moduleName, actionName] = actionType.match(regex);
    }

    return [
      actionType, // exact action
      `@@${moduleName}`, // any action by the module
      `@@${moduleName}/`, // any action by the module (alias)
      `@@${moduleName}/*`, // any action by the module (alias)
      `@@*/${actionName}`, // same action dispatched by any module
      `*/${actionName}`, // same action dispatched by any module (alias)
      '*', // any action
    ];
  }
}

export default Module;
