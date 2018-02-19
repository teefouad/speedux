'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useMiddleware = exports.updateStore = exports.store = undefined;

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _reducer = require('./reducer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a middleware function that is used to enable Redux devTools
 * in the browser.
 * @type {Function}
 */
var devTools = (0, _redux.compose)(window.devToolsExtension ? window.devToolsExtension() : function (foo) {
  return foo;
});

/**
 * An array of middlewares to use when creating the store.
 * Use useMiddleware method to add other middleware functions to this list.
 * @type {Array}
 */


/**
 * Local imports.
 */
/**
 * Dependency imports.
 */
var middleWares = [(0, _redux.applyMiddleware)(_reduxThunk2.default), devTools];

/**
 * The Redux store.
 * @type {Object}
 */
var store = exports.store = (0, _redux.createStore)((0, _reducer.getRootReducer)(), _redux.compose.apply(undefined, middleWares));

/**
 * Updates the root reducer of the store.
 */
var updateStore = exports.updateStore = function updateStore() {
  return store.replaceReducer((0, _reducer.getRootReducer)());
};

/**
 * Allows registering middleware functions such as Router and other middlewares.
 * @param {Function} middleWare Middleware function to use
 */
var useMiddleware = exports.useMiddleware = function useMiddleware(middleWare) {
  return middleWares.unshift((0, _redux.applyMiddleware)(middleWare));
};

/**
 * Default export.
 */
exports.default = store;