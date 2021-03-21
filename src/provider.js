/**
 * Dependency imports
 */
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

/**
 * Local imports
 */
import store from './store';

/**
 * Wrapper component for react-redux Provider with the store already passed in.
 */
const Provider = props => (
  <ReduxProvider
    store={store.create()}
    {...props}
  />
);

Provider.displayName = 'withStore(Provider)';

export default Provider;
