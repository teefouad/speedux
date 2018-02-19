/**
 * Dependency imports.
 */
import { combineReducers } from 'redux';

/**
 * An object that is used as a map to store references to registered
 * reducers. This object is used by `getRootReducer` to create the
 * root reducer for the store.
 * @type {Object}
 */
export const registeredReducers = {};

/**
 * Registers a reducer function.
 * @param  {String}   key       Reducer unique identifier key.
 * @param  {Function} reducer   Reducer function.
 * @return {Boolean}            Whether the reducer function was successfully registered or not.
 */
export const registerReducer = (key, reducer) => {
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
export const unregisterReducer = (key) => {
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
export const unregisterAllReducers = () => {
  Object.keys(registeredReducers).forEach(reducerKey => unregisterReducer(reducerKey));
  return Object.keys(registeredReducers).length === 0;
};

/**
 * Combines all registered reducers and returns a single reducer function.
 * @return {Function} The root reducer function.
 */
export const getRootReducer = () => {
  if (Object.keys(registeredReducers).length === 0) {
    return combineReducers({
      $_foo: (state = {}) => state, // default reducer
    });
  }

  return combineReducers(registeredReducers);
};

