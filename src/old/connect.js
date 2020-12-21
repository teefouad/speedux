/**
 * Dependency imports.
 */
import { Component } from 'react';
import { connect as reduxConnect } from 'react-redux';

/**
 * Local imports.
 */
import store from './store';
import Module from './module';
import * as helpers from './helpers';

/**
 * Error messages map
 */
export const ERRORS = {
  MISSING_ARGS: 'The \'connect\' function expects a component definition and a valid configuration object as parameters.',
  INVALID_COMPONENT: 'Expected the first parameter to be a pure function or a valid React component class.',
  INVALID_CONFIG: 'Configuration must be a valid object.',
  MISSING_NAME: 'Property \'name\' is missing from the configuration. Name is required.',
};

/**
 * Connects a component to the Redux store and injects its module state and actions into the
 * component props. If the module name is not provided, the name of the component or function
 * will be used instead. If the component definition is an anonymous function, then the module
 * name must be provided in the configuration object. If the initial state is not provided, an
 * empty object will be assumed to be the initial state.
 * @param {Class|Function}    component   The component to be connected.
 * @param {Object}            config      Configuration object that may contain all or some of
 *                                        the following keys:
 *                                          - name
 *                                              Module namespace, which will be used as a key in
 *                                              the state tree and as a prefix for module actions.
 *                                          - state
 *                                              The initial state object for the module. This
 *                                              object is used to populate the Redux state object
 *                                              with initial values.
 *                                          - globalState
 *                                              A hash table of all the other states for other
 *                                              modules that should be injected into the props.
 *                                              Pass 'true' to retrieve the complete state for
 *                                              that module.
 *                                          - actions
 *                                              A hash table of all the actions that can be
 *                                              dispatched from the component to update the state.
 *                                          - handlers
 *                                              A hash table of handler function that listen to
 *                                              actions dispatched by the store. The key represents
 *                                              the action type that needs to be handled and the
 *                                              value represents the handler function.
 *                                          - stateKey
 *                                              The stateKey is a string used to inject the module
 *                                              state into the component props.
 *                                              The default value is 'state'.
 *                                          - globalStateKey
 *                                              The globalStateKey is a string used to inject the
 *                                              global state tree, excluding the module state, into
 *                                              the component props.
 *                                              The default value is 'globalState'.
 *                                          - actionsKey
 *                                              The actionsKey is a string used to inject the module
 *                                              action creator functions into the component props.
 *                                              The default value is 'actions'.
 *                                          - dispatchKey
 *                                              The dispatchKey is a string used to inject the
 *                                              dispatch function into the component props.
 *                                              The default value is 'actions'.
 */
const connect = (component, config) => {
  if (!component || !config) {
    throw new Error(ERRORS.MISSING_ARGS);
  }

  if (typeof component !== 'function' && Object.getPrototypeOf(component) !== Component) {
    throw new Error(ERRORS.INVALID_COMPONENT);
  }

  if (helpers.getObjectType(config) !== 'object') {
    throw new Error(ERRORS.INVALID_CONFIG);
  }

  const moduleConfig = {
    ...config,
    name: config.name || helpers.getComponentName(component),
  };

  if (!moduleConfig.name) {
    throw new Error(ERRORS.MISSING_NAME);
  }

  const module = new Module(moduleConfig);
  const initialState = moduleConfig.initialState || moduleConfig.state || {};

  const ConnectedComponent = reduxConnect(
    module.mapStateToProps,
    module.mapDispatchToProps,
    module.combineProps,
  )(component);

  store.registerName(moduleConfig.name);
  store.useReducer(module.name, module.reducer, initialState);
  store.useSagas(module.sagas);

  return ConnectedComponent;
};

export default connect;
