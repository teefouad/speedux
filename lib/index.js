'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Dependency imports.
                                                                                                                                                                                                                                                                   */


/**
 * Re-exports.
 */


var _connect = require('./connect');

Object.keys(_connect).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _connect[key];
    }
  });
});

var _reducer = require('./reducer');

Object.keys(_reducer).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _reducer[key];
    }
  });
});

var _store = require('./store');

Object.keys(_store).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _store[key];
    }
  });
});
exports.createModule = createModule;

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Represents the module that is currently being created.
 * This will be initialized with a new object in createModule
 * and modified in each createAction.
 */
var _module = null;

/**
 * Creates a module object that contains the initial state, action creators
 * object and the reducer function. This module can be used with `connect`
 * function to connect a component to the redux store.
 * @param   {String}    moduleKey       A unique identifier key for the module, this
 *                                      can be the component name.
 * @param   {Object}    initialState    The initial state object for the component.
 * @param   {Function}  callback        A callback function that receives a single
 *                                      parameter, an object that holds references
 *                                      to `setState` and `createAction`.
 *                                      Function `setState` can accept an object that
 *                                      represents the state keys that need to be
 *                                      updated and their updated values.
 *                                      Function `createAction` is used to define a
 *                                      Redux action, check below for more info.
 * @return  {Object}                    The module object.
 */
function createModule(moduleKey, initialState, callback) {
  // initialize the module object
  _module = {
    // unique identifier key for the module
    key: moduleKey,
    // a hashmap of all the action types for the module with the type as the key
    // and the prefixed type as the value
    types: {},
    // a hashmap of all the action creator functions for the module with the type
    // as the key and the action creator function as the value
    actions: {},
    // an hashmap that holds the state fragments for each action with the type as
    // the key and the state fragment object as the value, a state fragment is used
    // to update the state object
    stateFragments: {},
    // a hashmap of the arguments each action creator expects with the type as the
    // key and an array of argument names as the value
    argNames: {},
    // the initial state object for the module
    initialState: initialState,
    // a function that is used to store state fragments, this function is re-defined
    // for each createAction call (check the next function) and whenever setState
    // is called it will update the stateFragments hashmap defined above with the
    // stateFragment object it receives
    setState: function setState() {}
  };

  // invoke the module callback function to execute all calls to createAction
  callback({
    createAction: createAction,
    getState: function getState(query) {
      var state = _store.store.getState()[_module.key];
      debugger;
      // handle query strings
      if (helpers.getObjectType(query) === 'string') {
        return helpers.findPropInObject(state, query);
      }

      // handle query objects
      if (helpers.getObjectType(query) === 'object') {
        return Object.keys(query).reduce(function (prev, next) {
          return _extends({}, prev, _defineProperty({}, next, helpers.findPropInObject(state, query[next])));
        }, {});
      }

      return state;
    },

    // module.setState reference will change upon each createAction call and
    // setState reference cannot change across different createAction calls, so
    // you cannot simply pass module.setState
    setState: function setState() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _module.setState.apply(this, args);
    }
  });

  return {
    initialState: initialState,
    stateKey: moduleKey,
    types: _module.types,
    actions: _module.actions,
    reducer: function reducer() {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
      var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      // get the unprefixed action type
      var type = action.type.split('/')[1];

      // get the stored state fragment for this action
      var stateFragment = _module.stateFragments[type];

      // if there is a stateFragment object for this action, use it to patch the state
      if (stateFragment) {
        var newState = _extends({}, state);

        Object.keys(stateFragment).forEach(function (query) {
          newState = _extends({}, newState, helpers.findPropInObject(newState, query, stateFragment[query]));
        });

        return newState;
      }

      return state;
    }
  };
}

/**
 * Creates the action creator functions for the module. This function should only be called
 * inside the context of a createModule function call. It essentially modifies the `module`
 * object that is initialized by the createModule function.
 * @param {String}    type        An uppercase snake_case string that represents the action
 *                                type. For example 'ADD_COUNT' or 'CHANGE_USER_EMAIL'.
 * @param {Function}  callback    A function that returns an object. The returned object
 *                                represents a state fragment which is used to update the
 *                                module state object. For asyncronous actions, use a generator
 *                                function.
 */
function createAction(type, callback) {
  // get a list of the argument names that the `callback` function expects
  // these argument names will be used to build the `payload` object with
  // the proper keys
  _module.argNames[type] = helpers.getArgNames(callback);

  // register the prefixed action type
  _module.types[type] = '@@' + _module.key + '/' + type;

  // register action creator function
  _module.actions[helpers.snake2CamelCase(type)] = function actionCreator() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    // update the module setState function, this definition is for the syncronous
    // actions, it simply stores the state fragment object that is passed to it
    _module.setState = function (stateFragment) {
      _module.stateFragments[type] = stateFragment;
    };

    // invokes the callback function to sniff the return value, this is to check if
    // the action is syncronous or asyncronous (check further below)
    var result = callback.apply(undefined, args);
    // build the payload object
    var payload = _module.argNames[type].reduce(function (prev, next, index) {
      return _extends({}, prev, _defineProperty({}, next, args[index]));
    }, {});
    // build the action object
    var action = {
      type: _module.types[type],
      payload: payload
    };

    // check if the callback return value is an iterable (usually a generator function)
    // if it is an iterable then return a thunk instead of the action object and consume
    // the generator function
    if (result && typeof result[Symbol.iterator] === 'function') {
      return function (dispatch) {
        // update the module setState function, this definition is for the asyncronous
        // actions, it simply stores the state fragment object that is passed to it and
        // dispatches the action afterwards
        _module.setState = function (stateFragment) {
          _module.stateFragments[type] = stateFragment;
          // during asyncronous actions, each call to setState should dispatch the action
          // in order to be able to update the state
          dispatch(action);
        };

        // recursively consume the generator function, `iterable` is the iterable object and
        // `data` is the data resolved from a promise (if any)
        (function consumeIterable(iterable, data) {
          var next = iterable.next(data);

          // if the generator yields a promise, wait for the promise to resolve before making
          // the next call
          if (next.value instanceof Promise) {
            next.value.then(function (promiseResult) {
              consumeIterable(iterable, promiseResult);
            });
          } else if (!next.done) {
            // get the next value, if there is one
            consumeIterable(iterable, next.value);
          }
        })(result);
      };
    }

    // if the action is syncronous, return the action object
    return action;
  };
}

exports.default = createModule;