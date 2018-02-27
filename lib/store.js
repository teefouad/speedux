'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StoreManager = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Dependency imports.
                                                                                                                                                                                                                                                                   */


var _redux = require('redux');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Creates a middleware function that is used to enable Redux devTools
 * in the browser.
 * @type {Function}
 */
var devTools = (0, _redux.compose)(window.devToolsExtension ? window.devToolsExtension() : function (foo) {
  return foo;
});

/**
 * Reference to hold the Redux store instance.
 * @type {Object}
 */
var storeInstance = void 0;

/**
 * This is not the actual store. This is a wrapper object that manages
 * the Redux store instance. Use `StoreManager.getInstance()` to get a reference
 * to the Redux store.
 */
var StoreManager = exports.StoreManager = {
  /**
   * An object that is used as a map to store references to registered
   * reducers. This object is used by `getRootReducer` to create the
   * root reducer for the store.
   * @type {Object}
   */
  reducers: {},

  /**
   * An array of middlewares to use when creating the store.
   * Use `useMiddleware` method to add other middleware functions to this list.
   * @type {Array}
   */
  middleWares: [devTools],

  /**
   * Registers a reducer function.
   * @param  {String}   key       Reducer unique identifier key.
   * @param  {Function} reducer   Reducer function.
   */
  addReducer: function addReducer(name, reducer) {
    StoreManager.reducers[name] = reducer;
  },


  /**
   * Unregisters a reducer function.
   * @param  {String}   key   Reducer unique identifier key.
   */
  removeReducer: function removeReducer(name) {
    delete StoreManager.reducers[name];
  },


  /**
   * Unregisters all reducer functions.
   */
  removeAllReducers: function removeAllReducers() {
    Object.keys(StoreManager.reducers).forEach(function (name) {
      return StoreManager.removeReducer(name);
    });
  },


  /**
   * Combines all registered reducers and returns a single reducer function.
   * @return {Function} The root reducer function.
   */
  getRootReducer: function getRootReducer() {
    return (0, _redux.combineReducers)(_extends({
      $_foo: function $_foo() {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return state;
      } }, StoreManager.reducers));
  },


  /**
   * Returns an reference to the Redux store instance.
   * @return {Object} Reference to the store instance.
   */
  getInstance: function getInstance() {
    if (!storeInstance) {
      StoreManager.buildInstance();
    }

    return storeInstance;
  },


  /**
   * Creates a new Redux store instance and updates the reference.
   */
  buildInstance: function buildInstance() {
    storeInstance = (0, _redux.createStore)(StoreManager.getRootReducer(), _redux.compose.apply(undefined, _toConsumableArray(StoreManager.middleWares)));
  },


  /**
   * Updates the root reducer of the store. Call this method after adding or
   * removing reducers.
   */
  update: function update() {
    return storeInstance.replaceReducer(StoreManager.getRootReducer());
  },


  /**
   * Allows registering middleware functions such as Router and other middlewares.
   * @param {Function} middleWare Middleware function to use
   */
  useMiddleware: function useMiddleware(middleWare) {
    return StoreManager.middleWares.unshift((0, _redux.applyMiddleware)(middleWare));
  }
};

/**
 * Default export.
 */
exports.default = StoreManager.getInstance();