/**
 * Dependency imports.
 */
import { useState as useReactState } from 'react';
import { useSelector, useDispatch as useReduxDispatch } from 'react-redux';

/**
 * Local imports.
 */
import Module from './module';
import store from './store';
import dispatch from './dispatch';
import * as helpers from './helpers';

/**
 * Error messages map
 */
export const ERRORS = {
  MISSING_NAME: 'Function `createHooks` expects the name string as a first parameter.',
  INVALID_NAME: 'Name must be a string.',
  INVALID_CONFIG: 'Configuration must be a valid object.',
};

export default (arg = {}) => {
  let { name } = arg;
  let config = {};

  if (helpers.getObjectType(arg) === 'string') {
    name = arg;
  } else {
    config = arg;
  }

  if (helpers.getObjectType(config) !== 'object') {
    throw new Error(ERRORS.INVALID_CONFIG);
  }

  if (!name) {
    throw new Error(ERRORS.MISSING_NAME);
  }

  if (helpers.getObjectType(name) !== 'string') {
    throw new Error(ERRORS.INVALID_NAME);
  }

  const module = new Module({ name, ...config });

  store.registerName(name);
  store.useReducer(module.name, module.reducer, config.initialState || config.state || {});
  store.useSagas(module.sagas);

  const useState = (state) => {
    if (state) store.useReducer(module.name, module.reducer, state);
    return useSelector(stateTree => stateTree[module.name]);
  };

  let actionsRef = config.actions;
  const useActions = (actions) => {
    if (actions && !helpers.deepCompare(actions, actionsRef)) {
      module.buildActionCreators(actions);
      store.sagas = [];
      store.useSagas(module.sagas);
      actionsRef = actions;
    }

    return module.mapDispatchToProps(useReduxDispatch());
  };

  let handlersRef = config.handlers;
  const useHandlers = (handlers = {}) => {
    if (handlers && !helpers.deepCompare(handlers, handlersRef)) {
      module.buildHandlers(handlers);
      store.useSagas(module.sagas);
      handlersRef = handlers;
    }
  };

  const useDispatch = () => dispatch;

  const useGlobalState = (queries) => {
    const [ready, setReady] = useReactState(false);
    if (!ready) setTimeout(() => setReady(true), 0);
    return useSelector(() => {
      if (!ready) return null;
      return module.getGlobalState(queries ?? config.globalState);
    });
  };

  return {
    useState,
    useActions,
    useHandlers,
    useDispatch,
    useGlobalState,
  };
};
