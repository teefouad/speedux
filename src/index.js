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
 * Re-exports.
 */
export { Provider } from 'react-redux';

/**
 * A valid StoreManager must be used with the Connector before calling Connector.connect()
 * with any component.
 */
Connector.use(StoreManager);

/**
 * Export a store instance.
 */
export const store = StoreManager.getInstance();

/**
 * Export addReducer and useMiddleware from the store manager.
 * addReducer(key, reducerFunction)     Allows using middlewares with the store
 * useMiddleware(middlewareFunction)    Adds a reducer function to be used by the root reducer
 */
export const { addReducer, useMiddleware } = StoreManager;

/**
 * Export a getState method to help retrieve the state of any module.
 */
export const { getState } = StoreManager;

/**
 * Dispatches an action. It may accepts two or three parameters:
 * dispatch(actionType, payload);
 * dispatch(moduleName, actionName, payload);
 * @param   {String}  actionType  Type of the action to be dispatched
 * @param   {String}  moduleName  Name of the module that contains the action
 * @param   {String}  actionName  Name of the action to be dispatched
 * @param   {Object}  payload     Action payload object
 */
export function dispatch(...args) {
  const action = {};

  if (helpers.getObjectType(args[args.length - 1]) === 'object') {
    action.payload = { ...args[args.length - 1] };
    args.splice(args.length - 1, 1);
  } else {
    action.payload = {};
  }

  if (args.length === 1) {
    [action.type] = args;
  } else {
    const camelCaseName = helpers.toCamelCase(args[1]);
    const actionName = helpers.toSnakeCase(camelCaseName).toUpperCase();
    action.type = `@@${args[0]}/${actionName}`;
  }

  store.dispatch(action);
}

/**
 * Connects a component to the Redux store and injects its module state and actions into the
 * component props. If the module name is not provided, the name of the component or function
 * will be used instead. If the initial state is not provided, an empty object will be assumed
 * to be the initial state.
 * @param {Class|Function}    component   The component to be connected.
 * @param {Object}            module      A configuration module object returned from createModule.
 */
export function connect(component, module = {}) {
  if (helpers.getObjectType(module) !== 'object') {
    throw new Error('Provided module must be an object');
  }

  if (!module.name) {
    module.setName(helpers.getComponentName(component));
  }

  return Connector.connect(component, module);
}

/**
 * Export a createModule function that creates and returns a module object. The returned object
 * will contain the initial state, action creators object, sagas object and the reducer function.
 * @param   {String}    name      A unique identifier string that represents the module name.
 * @param   {Object}    config    An object that represents the module configuration.
 * @return  {Object}              The module object.
 */
export function createModule(name, config = {}) {
  if (!name) {
    throw new Error('You must provide a unique name for the module');
  }

  if (typeof createModule.moduleNames === 'undefined') {
    createModule.moduleNames = {};
  }

  if (createModule.moduleNames[name] === true) {
    throw new Error(`Name '${name}' is already used by another module, please provide a different name`);
  } else {
    createModule.moduleNames[name] = true;
  }

  if (helpers.getObjectType(config) !== 'object') {
    throw new Error('Module configuration must be an object');
  }

  return new Module({
    store,
    name,
    ...config,
  });
}

export default connect;
