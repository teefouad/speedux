/**
 * Dependency imports.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Provider as ReduxProvider } from 'react-redux';

/**
 * Local imports.
 */
import store from './store';

/**
 * Re-exports.
 */
export { default as connect } from './connect';
export { default as createHooks } from './hook';
export const useReducer = (...args) => store.useReducer(...args);
export const useMiddleware = (...args) => store.useMiddleware(...args);

/**
 * Returns an instance of the store.
 */
export const getStore = () => store.create();

/**
 * Wrapper component for react-redux Provider with the store already passed in.
 */
export const Provider = ({ store: storeProp, ...props }) => {
  if (typeof storeProp !== 'undefined') {
    const { warn } = console;
    warn('The `store` prop passed to the Provider component will be ignored. Use functions `useReducer` and `useMiddleware` to customize the store.');
  }

  return (
    <ReduxProvider
      {...props}
      store={getStore()}
    />
  );
};

Provider.propTypes = {
  store: PropTypes.any, /* eslint-disable-line */
};

Provider.defaultProps = {
  store: undefined,
};

Provider.displayName = 'withStore(Provider)';
