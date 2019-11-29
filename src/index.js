/**
 * Dependency imports.
 */
import React from 'react';
import ReduxProvider from 'react-redux/lib/components/Provider';

/**
 * Local imports.
 */
import store from './store';

/**
 * Re-exports.
 */
export { default as connect } from './connect';
export const useReducer = (...args) => store.useReducer(...args);
export const useMiddleware = (...args) => store.useMiddleware(...args);

/**
 * Returns an instance of the store.
 */
export const getStore = () => store.create();

/**
 * Wrapper component for react-redux Provider with the store already passed in.
 */
export const Provider = props => (
  <ReduxProvider
    {...props}
    store={getStore()}
  />
);

Provider.displayName = 'withStore(Provider)';
