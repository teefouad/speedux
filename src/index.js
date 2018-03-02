/**
 * Dependency imports.
 */
import 'babel-polyfill';

/**
 * Local imports.
 */
import Connector from './connector';
import Module from './module';
import { StoreManager } from './store';
import * as helpers from './helpers';

/**
 * A valid StoreManager must be used with the Connector before calling Connector.connect()
 * with any component
 */
Connector.use(StoreManager);

/**
 * Export a store instance
 */
export const store = StoreManager.getInstance();

/**
 * Export addReducer and useMiddleware from the store manager
 * addReducer(key, reducerFunction)     Allows using middlewares with the store
 * useMiddleware(middlewareFunction)    Adds a reducer function to be used by the root reducer
 */
export const { addReducer, useMiddleware } = StoreManager;

/**
 * Export a proxy function to Connector.connect method.
 * Connects a component to the Redux store and injects its state and actions via the props.
 */
export function connect(component, module) {
  return Connector.connect(component, module);
}

/**
 * Export a createModule function that creates a module object internally and exposes a limited
 * number of api methods publicly. The exported module will contain the initial state, action
 * creators object, sagas object and the reducer function. The returned module can be used with
 * the `connect` function to connect a component to the redux store.
 *
 * If the module name is not provided, the name of the component or function will be used instead.
 * If the initial state is not provided, an empty object will be assumed to be the initial state.
 *
 * @param {String}    moduleName      A unique identifier key for the module.
 * @param {Object}    initialState    An object that represents the initial state of the component.
 * @param {Function}  callback        A callback function that can be used to create/handle actions.
 *                                    It receives a single parameter, an object that holds
 *                                    references to `createAction`, `handleAction` and `getState`
 *                                    methods.
 * @return  {Object}                  The module object.
 */
export function createModule(...args) {
  // the module name is assumed null by default
  // if not provided, the Connector.connect() function will auto-generate it based on the
  // component or function name
  let name = null;
  let initialState = {};
  let callback = () => null;

  if (helpers.getObjectType(args[0]) === 'function') {
    // handle: createModule(callback)
    [callback] = args;
  } else
  if (helpers.getObjectType(args[0]) === 'object') {
    // handle: createModule(initialState, callback)
    [initialState, callback] = args;
  } else {
    // handle: createModule(moduleName, initialState, callback)
    [name, initialState, callback] = args;
  }

  // create the module object
  const module = new Module(name, initialState, store);

  // create the public api object
  const api = {
    getState: module.getState,
    createAction: module.createAction,
    handleAction: module.handleAction,
  };

  // execute the callback to allow createAction and handleAction calls to be made
  callback.call(api, api);

  // return the module object
  return module;
}

export default createModule;
