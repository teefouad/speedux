/**
 * Dependency imports.
 */
import {
  applyMiddleware,
  createStore,
  compose,
} from 'redux';

import thunk from 'redux-thunk';

/**
 * Local imports.
 */
import { getRootReducer } from './reducer';

/**
 * Creates a middleware function that is used to enable Redux devTools
 * in the browser.
 * @type {Function}
 */
const devTools = compose(window.devToolsExtension ? window.devToolsExtension() : foo => foo);

/**
 * An array of middlewares to use when creating the store.
 * Use useMiddleware method to add other middleware functions to this list.
 * @type {Array}
 */
const middleWares = [
  applyMiddleware(thunk),
  devTools,
];

/**
 * The Redux store.
 * @type {Object}
 */
export const store = createStore(
  getRootReducer(),
  compose(...middleWares),
);

/**
 * Updates the root reducer of the store.
 */
export const updateStore = () => store.replaceReducer(getRootReducer());

/**
 * Allows registering middleware functions such as Router and other middlewares.
 * @param {Function} middleWare Middleware function to use
 */
export const useMiddleware = middleWare => middleWares.unshift(applyMiddleware(middleWare));

/**
 * Default export.
 */
export default store;
