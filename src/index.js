/**
 * Dependency imports.
 */
import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, Provider as ReduxProvider } from 'react-redux';

/**
 * Local imports.
 */
import store from './store';
import * as helpers from './helpers';

/**
 * =====================================================
 * Helper functions
 * =====================================================
 */

/**
 * Converts a string (camelCase) to (snake_case).
 * @param {String} str    String to be converted
 */
const toSnakeCase = (str) => {
  const camelCaseName = helpers.toCamelCase(str);
  return helpers.toSnakeCase(camelCaseName).toUpperCase();
};

/**
 * Converts a string (snake_case) to (camelCase).
 * @param {String} str    String to be converted
 */
const toCamelCase = (str) => {
  const snakeCaseName = helpers.toSnakeCase(str);
  return helpers.toCamelCase(snakeCaseName.toLowerCase());
};

/**
 * =====================================================
 * Store
 * =====================================================
 */

/**
 * Components are evaluated from the inside out (outwards).
 * This means that the store needs to be created before any
 * component gets to use it.
 */
store.create();

/**
 * Export a function that allows retrieving a store instance.
 * This is usually not needed, but it's available just in case.
 */
export const getStore = () => store.getInstance();

/**
 * =====================================================
 * Create global state function
 * =====================================================
 */

/**
 * An object that maps actions to their respective handlers
 * as described in configuration objects which are passed to
 * the createGlobalState function.
 */
const lookbook = { actions: {}, handlers: {} };


/**
 * Returns a `dispatch` function.
 * This `dispatch` function is used to dispatch normal action objects:
 *    dispatch(actionObject);
 * where:
 * @param   {Object}  actionObject  Normal action object that contains a 'type' property
 * for example:
 *    dispatch({ type: 'ADD_ITEM', itemId: 1 });
 *
 *
 * Or to dispatch an action that was defined using createGlobalState:
 *    dispatch(actionType, ...args);
 * where:
 * @param   {String}  actionType    Type of the defined action to be dispatched
 * @param   {*}       args          Arguments to be passed to the defined action
 * for example:
 *    dispatch('cart.addItem', 134, 'Leather belt', '$55');
 *
 *
 * You can pass the name of the global state to get a dispatch function
 * that works specifically with that piece of state.
 * @param   {String}  name          Name of a defined global state
 * for example:
 *    const dispatch = useDispatch('cart');
 *    dispatch('addItem', 134, 'Leather belt', '$55');
 */
export const useDispatch = name => (...args) => {
  let action = {};

  if (helpers.getObjectType(args[0]) === 'object') {
    action = helpers.deepCopy(args[0]);
  } else
  if (helpers.getObjectType(args[0]) === 'string') {
    // set the type
    if (name) {
      action.type = `@@${name}/${toSnakeCase(args[0])}`;
    } else
    if (/^([^.]*?)\.([^.]*?)$/.test(args[0])) {
      const [prefix, actionName] = args[0].split('.');
      action.type = `@@${prefix}/${toSnakeCase(actionName)}`;
    } else {
      [action.type] = args;
    }

    // set the payload
    action.payload = {};

    // set the args
    if (args.length > 1) {
      action.args = args.slice(1);
    }
  }

  return store.getInstance().dispatch(action);
};

const createReducer = (name, initialState = {}) => {
  const reducer = (prevState, action) => {
    const state = prevState ?? initialState;

    const actionPrefix = action.type.replace(/^@@|\/.*?$/g, '');
    const actionSuffix = action.type.replace(/^.*?\//, '');
    const [mainAction, subAction] = actionSuffix.split('/');

    let callback = lookbook.actions[name][toCamelCase(mainAction)];
    let callbackType = callback ? 'action' : false;

    if (!callback) {
      const handlers = lookbook.handlers[name];
      callback = handlers[action.type] ?? handlers[`${actionPrefix}.${toCamelCase(mainAction)}`];
      callbackType = callback ? 'handler' : false;
    }

    if (callback) {
      const callbackArgs = { action: action.args, handler: [action] }[callbackType];
      const callbackResult = subAction ? action.value : callback(...callbackArgs);
      const callbackResultType = helpers.getObjectType(callbackResult);

      let stateFragment = {};
      if (callbackResultType === 'object') stateFragment = callbackResult;
      if (callbackResultType === 'function') stateFragment = callbackResult(state[name]);
      if (callbackResultType === 'generator') {
        let data;
        let isDone = false;
        while (!isDone) {
          const next = callbackResult.next(data);

          requestAnimationFrame(() => {
            const dispatch = useDispatch();

            dispatch({
              type: `${action.type}/${next.done ? 'COMPLETE' : 'UPDATE'}`,
              value: next.value,
            });
          });

          isDone = next.done;
        }
      }

      return helpers.mergeObjects(state, stateFragment);
    }

    return state;
  };

  store.useReducer(name, reducer, initialState);
  store.update();
};

export const createGlobalState = ({
  name,
  state: initialState = {},
  actions = {},
  handlers = {},
}) => {
  lookbook.actions[name] = actions;
  lookbook.handlers[name] = handlers;

  createReducer(name, initialState);
};


export const useGlobalState = (name, newState) => {
  if (newState) {
    createReducer(name, newState);
  }

  return useSelector(globalState => globalState[name] ?? globalState);
};

export const useActions = (name) => {
  const actions = {};
  const dispatch = useDispatch(name);

  Object.keys(lookbook.actions[name]).forEach((actionName) => {
    actions[actionName] = (...args) => {
      dispatch(actionName, ...args);
    };
  });

  return actions;
};

export const useHandler = (actionType, handler) => {
  let targetActionType = actionType;

  if (/^(.*?)\.(.*?)$/.test(actionType)) {
    const [actionPrefix, actionSuffix] = actionType.split('.');
    targetActionType = `@@${actionPrefix}/${toSnakeCase(actionSuffix)}`;
  }

  useEffect(() => {
    store.subscribe(targetActionType, handler);

    return () => {
      store.unsubscribe(targetActionType, handler);
    };
  }, []);
};

export const useGenerator = (generatorFunction) => {
  const data = useRef();
  const nextValue = useRef();
  const iterator = useRef(generatorFunction());
  const [nextResult, setNextResult] = useState();

  const execute = async () => {
    const next = iterator.current.next(nextValue.current);

    if (next.value instanceof Promise) {
      next.value.then((value) => {
        nextValue.current = value;
      }).catch((err) => {
        nextValue.current = err;
      }).finally(() => {
        if (!next.done) setNextResult(next);
      });
    } else {
      data.current = next.value;
      if (!next.done) setNextResult(next);
    }
  };

  useEffect(() => {
    if (nextResult) execute();
  }, [nextResult]);

  return [data.current, execute];
};

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
