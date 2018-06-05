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
 * A hash map of all created modules with the module identifier as the key and the module
 * reference as the value.
 */
const modulesMap = {};

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
 * Connects a component to the Redux store and injects its state and actions via the props.
 * If the module name is not provided, the name of the component or function will be used instead.
 * If the initial state is not provided, an empty object will be assumed to be the initial state.
 * @param {Class|Function}    component     The component to be connected.
 * @param {Object}            config        An object that represents the module configuration.
 * @param {String}            identifier    A unique string that identifies this connected
 *                                          component. This identifier may be used later to
 *                                          retrieve a reference to the created module object.
 */
export function connect(component, config = {}, identifier = null) {
  if (helpers.getObjectType(config) !== 'object') {
    throw new Error('Module configuration must be an object');
  }

  const name = config.name || helpers.getComponentName(component);

  const module = createModule({
    ...config,
    name,
  });

  modulesMap[identifier || name] = module;

  return Connector.connect(component, module);
}

/**
 * Export a createModule function that creates a module object internally. The exported module
 * will contain the initial state, action creators object, sagas object and the reducer function.
 *
 * @param {Object}    config          An object that represents the module configuration.
 * @return  {Object}                  The module object.
 */
export function createModule(config = {}) {
  if (helpers.getObjectType(config) !== 'object') {
    throw new Error('Module configuration must be an object');
  }

  return new Module({
    ...config,
    store,
  });
}

/**
 * Returns a reference to a module that was created after calling `connect` on a component.
 * @param {String} identifier Module identifier. This is the identifier string that was used
 *                            when `connect` was called.
 */
export function getModule(identifier) {
  return modulesMap[identifier];
}

export default connect;
