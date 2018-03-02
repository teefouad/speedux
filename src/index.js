import 'babel-polyfill';

import { StoreManager } from './store';
import Module from './module';
import Connector from './connector';
import * as helpers from './helpers';

Connector.use(StoreManager);

export const store = StoreManager.getInstance();

export const { useMiddleware, addReducer } = StoreManager;

export function connect(component, module) {
  return Connector.connect(component, module);
}

export function createModule(...args) {
  let name = null;
  let initialState = {};
  let callback = () => null;

  if (helpers.getObjectType(args[0]) === 'function') {
    [callback] = args;
  } else
  if (helpers.getObjectType(args[0]) === 'object') {
    [initialState, callback] = args;
  } else {
    [name, initialState, callback] = args;
  }

  const module = new Module(name, initialState, store);
  const api = {
    setState: module.setState,
    getState: module.getState,
    createAction: module.createAction,
    handleAction: module.handleAction,
  };

  callback.call(api, api);

  return module;
}

export default createModule;
