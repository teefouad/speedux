/**
 * Dependency imports
 */
import { getType, mergeObjects } from 'noyb';

/**
 * Local imports
 */
import store from './store';
import useDispatch from './use-dispatch';
import useGlobalState from './use-global-state';
import useActions from './use-actions';
import lookbook from './lookbook';
import * as helpers from './helpers';

/**
 * Error messages map
 */
export const ERRORS = {
  MISSING_CONFIG: 'Configuration object is required.',
  INVALID_CONFIG: 'Configuration must be a valid object.',
  MISSING_NAME: 'Missing required field `name` for the global state.',
  INVALID_NAME: 'Name must be a string.',
};

export const createReducer = (name, initialState = {}) => {
  const reducer = (prevState, action) => {
    const state = prevState ?? initialState;

    const actionParts = []; // [actionPrefix, mainAction, subAction]

    if (action.subtype) {
      if (/@@(.+?)\/(.+)/.test(action.type)) {
        const actionSuffix = action.type.replace(/^.*?(\/|$)/, '');
        actionParts[0] = action.type.replace(/^@@|\/.*?$/g, '');
        [actionParts[1], actionParts[2]] = actionSuffix.split('/');
      } else {
        [actionParts[1], actionParts[2]] = action.type.split('/');
      }

      if (actionParts[2] !== 'UPDATE') {
        return state;
      }
    } else
    if (/@@(.+?)\/(.+)/.test(action.type)) {
      actionParts[0] = action.type.replace(/^@@|\/.*?$/g, '');
      actionParts[1] = action.type.replace(/^.*?(\/|$)/, '');
    } else {
      [actionParts[1], actionParts[2]] = action.type.split('/');
    }

    let callback = lookbook.actions[name][helpers.toCamelCase(actionParts[1])];
    let callbackType = callback ? 'action' : false;

    if (!callback) {
      const handlers = lookbook.handlers[name];
      callback = handlers[actionParts[1]] ?? handlers[`${actionParts[0]}.${helpers.toCamelCase(actionParts[1])}`];
      callbackType = callback ? 'handler' : false;
    }

    if (callback) {
      const callbackArgs = { action: action.args, handler: [action] }[callbackType];
      const callbackResult = action.subtype ? action.value : callback(...callbackArgs);
      const callbackResultType = getType(callbackResult);

      let stateFragment = {};

      if (callbackResult && typeof callbackResult[Symbol.iterator] === 'function' && typeof callbackResult.next === 'function') {
        const dispatchSubAction = (type, value, cb) => {
          requestAnimationFrame(() => {
            const dispatch = useDispatch();

            dispatch({
              type: `${action.type}/${type}`,
              value,
              subtype: true,
            });

            cb();
          });
        };

        const execute = async (data) => {
          const next = callbackResult.next(data);

          if (next.value instanceof Promise) {
            next.value.then((resolvedValue) => {
              dispatchSubAction('RESOLVE', resolvedValue, () => {
                if (!next.done) execute(resolvedValue);
              });
            }).catch((err) => {
              dispatchSubAction('ERROR', err.message, () => {
                if (!next.done) execute(err);
              });
            });
          } else {
            dispatchSubAction(next.done ? 'COMPLETE' : 'UPDATE', next.value, () => {
              if (!next.done) execute(next.value);
            });
          }
        };

        execute();

        return state;
      }

      if (callbackResultType === 'object') {
        stateFragment = callbackResult;
      }

      if (callbackResultType === 'function') {
        stateFragment = callbackResult(state);
      }

      return mergeObjects(state, stateFragment);
    }

    return state;
  };

  store.useReducer(name, reducer, initialState);
  store.update();
};

export default (config) => {
  if (!config) {
    throw new Error(ERRORS.MISSING_CONFIG);
  }

  const {
    name,
    state = {},
    actions = {},
    handlers = {},
  } = config;

  if (getType(config) !== 'object') {
    throw new Error(ERRORS.INVALID_CONFIG);
  }

  if (!name) {
    throw new Error(ERRORS.MISSING_NAME);
  }

  if (getType(name) !== 'string') {
    throw new Error(ERRORS.INVALID_NAME);
  }

  store.registerName(name);

  lookbook.actions[name] = actions;
  lookbook.handlers[name] = handlers;

  createReducer(name, state);

  return {
    useState: query => useGlobalState(query ? `${name}.${query}` : name),
    useActions: () => useActions(name),
  };
};
