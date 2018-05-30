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
 * @param {Object}    config          An object that represents the module configuration.
 */
export function connect(component, config = {}) {
  if (helpers.getObjectType(config) !== 'object') {
    throw new Error('Module configuration must be an object');
  }

  const targetComponent = component;

  targetComponent.module = createModule({
    ...config,
    name: config.name || helpers.getComponentName(component),
  });

  return Connector.connect(targetComponent, targetComponent.module);
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

export default connect;
