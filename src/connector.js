/**
 * Dependency imports.
 */
import { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect as reduxConnect } from 'react-redux';

/**
 * Local imports.
 */
import { getComponentName } from './helpers';

/**
 * This is a wrapper object that allows connecting components to a Redux store.
 * First, set a reference to a StorManage object using `Connector.use()` then
 * use `Connector.connect()`.
 */
const Connector = {
  /**
   * Holds a refernece to a StoreManager object. Set this with `Connector.use()` method.
   */
  storeManager: null,

  /**
   * Allows setting a reference to a StoreManager object.
   * @param {Object}  storeManager Reference to a StoreManager object.
   */
  use: (storeManager) => {
    Connector.storeManager = storeManager;
  },

  /**
   * Connects a component to the Redux store and injects its module state and actions into the
   * component props. It takes two arguments, the component to be connected and a configuration
   * object then returns the connected component.
   * @param   {Class|Function}   component   Reference to the class or function of the component
   *                                         to be connected to the store.
   * @param   {Object}            config     Configuration object that contains the following keys:
   *                                         - reducer
   *                                            Reference to the component reducer function.
   *                                         - actionCreators
   *                                            Reference to the actions object. This is a hash
   *                                            table of action creator functions.
   *                                         - sagas
   *                                            Reference to the sagas object. This is a hash table
   *                                            of generator functions, each represents a saga.
   *                                         - name
   *                                            Key to be used to save and extract the state object.
   *                                         - stateKey
   *                                            Namespace that will be used to pass component
   *                                            state via props.
   *                                         - actionsKey
   *                                            Namespace that will be used to pass component
   *                                            actions via props.
   * @return  {Object}            The connected component.
   */
  connect: (component, config = {}) => {
    // the passed component must be a valid React component class or a function
    if (typeof component !== 'function' && Object.getPrototypeOf(component) !== Component) {
      throw new Error('Expected the first parameter to be a pure function or a valid React component class.');
    }

    // the passed configuration must be an object
    if (typeof config !== 'object') {
      throw new Error('Expected the second parameter to be a valid object.');
    }

    // Connector.use() must be called with a valid StoreManager before calling connect()
    if (Connector.storeManager === null) {
      throw new Error('Expected a valid StoreManager to be used before calling `connect`.');
    }

    // if no reducer is provided, use a simple reducer that returns the state as it is.
    const reducer = config.reducer || ((state = {}) => state);

    // default value for the actions object is an empty object (no actions).
    const actions = config.actionCreators || {};

    // default value for the sagas object is an empty object (no sagas).
    const sagas = config.sagas || {};

    // get the component name
    const componentName = getComponentName(component);

    // if 'auto' is used as a stateKey, the component display name or function name will be used
    const stateKey = (config.stateKey === 'auto' ? componentName : config.stateKey);

    // if 'auto' is used as a actionsKey, the component display name or function name will be used
    const actionsKey = (config.actionsKey === 'auto' ? componentName : config.actionsKey);

    // if no name is provided, the component display name or function name will be used
    const name = (config.name === '' ? componentName : config.name);

    // register reducer
    if (reducer && name) {
      Connector.storeManager.addReducer(name, reducer);
    }

    // maps state to component props
    const mapStateToProps = (stateKey ? state => ({
      [stateKey]: state[name],
    }) : null);

    // maps actions to dispatchProps
    const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

    // combines component props, mapped props from state and mapped props from dispatchProps
    const combineProps = (stateProps, dispatchProps, ownProps) => {
      const newProps = {
        ...ownProps,
        ...stateProps,
      };

      if (actionsKey) {
        if (actionsKey === stateKey) {
          newProps.actions = {
            [actionsKey]: { ...dispatchProps },
          };
        } else {
          newProps[actionsKey] = { ...dispatchProps };
        }
      }

      return newProps;
    };

    // get the connected component
    const connectedComponent = reduxConnect(
      mapStateToProps,
      mapDispatchToProps,
      combineProps,
    )(component);

    // run each saga
    Object.keys(sagas).forEach((key) => {
      Connector.storeManager.runSaga(sagas[key]);
    });

    return connectedComponent;
  },
};

export default Connector;
