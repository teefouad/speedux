/**
 * Dependency imports.
 */
import { useState as useReactState, useMemo, useRef } from 'react';
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
  INVALID_NAME: 'Name must be a string.',
  MISSING_NAME: 'Name is required. Did you call `useRedux` without passing the name?',
  DUPLICATE_NAME: 'This name has already been used by another component, please use a different name.',
};

const modulesRegistry = {};

export default function useRedux(name) {
  if (!name) {
    throw new Error(ERRORS.MISSING_NAME);
  }

  if (helpers.getObjectType(name) !== 'string') {
    throw new Error(ERRORS.INVALID_NAME);
  }

  const registeredModule = modulesRegistry[name];

  const module = useMemo(() => {
    const moduleInstance = new Module({ name });
    modulesRegistry[name] = moduleInstance;
    return moduleInstance;
  }, [name]);

  if (registeredModule && registeredModule !== module) {
    const { warn } = console;
    warn(`Duplicate name: ${name}. ${ERRORS.DUPLICATE_NAME}`);
  }

  const updateStoreRef = useRef(true);

  const useState = initialState => useSelector((stateTree) => {
    if (updateStoreRef.current) {
      store.useReducer(module.name, module.reducer, initialState);
      store.update();
      updateStoreRef.current = false;
      return initialState;
    }

    return stateTree[module.name];
  });

  const useActions = (actions) => {
    useMemo(() => module.buildActionCreators(actions), [actions]);
    return module.mapDispatchToProps(useReduxDispatch());
  };

  const useHandlers = (handlers) => {
    useMemo(() => module.buildHandlers(handlers), [handlers]);
  };

  const useDispatch = () => dispatch;

  const useGlobalState = (queries) => {
    const [ready, setReady] = useReactState(false);
    if (!ready) setTimeout(() => setReady(true), 0);
    return useSelector(() => {
      if (!ready) return null;
      return module.getGlobalState(queries);
    });
  };

  return {
    useState,
    useActions,
    useHandlers,
    useDispatch,
    useGlobalState,
  };
}
