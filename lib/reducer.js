'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootReducer = exports.unregisterAllReducers = exports.unregisterReducer = exports.registerReducer = exports.registeredReducers = undefined;

var _redux = require('redux');

/**
 * An object that is used as a map to store references to registered
 * reducers. This object is used by `getRootReducer` to create the
 * root reducer for the store.
 * @type {Object}
 */
var registeredReducers = exports.registeredReducers = {};

/**
 * Registers a reducer function.
 * @param  {String}   key       Reducer unique identifier key.
 * @param  {Function} reducer   Reducer function.
 * @return {Boolean}            Whether the reducer function was successfully registered or not.
 */
/**
 * Dependency imports.
 */
var registerReducer = exports.registerReducer = function registerReducer(key, reducer) {
  if (key && reducer && registeredReducers[key] === undefined) {
    registeredReducers[key] = reducer;
    return true;
  }

  return false;
};

/**
 * Unregisters a reducer function.
 * @param  {String}   key   Reducer unique identifier key.
 * @return {Boolean}        Whether the reducer function was successfully unregistered or not.
 */
var unregisterReducer = exports.unregisterReducer = function unregisterReducer(key) {
  if (key && registeredReducers[key] !== undefined) {
    delete registeredReducers[key];
    return true;
  }

  return false;
};

/**
 * Unregisters all reducer functions.
 * @return {Boolean}  Whether all reducer functions were successfully unregistered or not.
 */
var unregisterAllReducers = exports.unregisterAllReducers = function unregisterAllReducers() {
  Object.keys(registeredReducers).forEach(function (reducerKey) {
    return unregisterReducer(reducerKey);
  });
  return Object.keys(registeredReducers).length === 0;
};

/**
 * Combines all registered reducers and returns a single reducer function.
 * @return {Function} The root reducer function.
 */
var getRootReducer = exports.getRootReducer = function getRootReducer() {
  if (Object.keys(registeredReducers).length === 0) {
    return (0, _redux.combineReducers)({
      $_foo: function $_foo() {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return state;
      } // default reducer
    });
  }

  return (0, _redux.combineReducers)(registeredReducers);
};