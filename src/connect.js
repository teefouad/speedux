/**
 * Dependency imports.
 */
import { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect as reduxConnect } from 'react-redux';

/**
 * Local imports.
 */
import { updateStore } from './store';
import { registeredReducers } from './reducer';

/**
 * Connects a component to the Redux store and injects its state and actions via the props.
 * It takes two arguments, the component to be connected and a configuration object then
 * returns the connected component.
 * @param   {Class}   component Reference to the class of the component to be connected
 *                              to the store.
 * @param   {Object}  config    Configuration object that contains the following keys:
 *                                - reducer         Reference to the component reducer function.
 *                                - actions         Reference to the actions object. This is an
 *                                                  object of action creator functions.
 *                                - stateKey        Namespace that will be used to pass component
 *                                                  state via props.
 *                                - actionsKey      Namespace that will be used to pass component
 *                                                  actions via props.
 * @return  {Object}            The connected component.
 */
export const connect = (component, config = {}) => {
  if (typeof component !== 'function' && Object.getPrototypeOf(component) !== Component) {
    throw new Error('Function `connect` expects the first parameter to be a pure function or a valid React component class.');
  }

  // if no reducer is provided, use a simple reducer that returns the state as it is.
  const reducer = config.reducer || ((state = {}) => state);

  // default value for the actions object is an empty object (no actions).
  const actions = config.actions || {};

  // default value for the stateKey component display name or function name
  // (component is stateless)
  const stateKey = (
    config.stateKey ||
    (component.displayName && `${component.displayName.charAt(0).toLowerCase()}${component.displayName.slice(1)}`) ||
    (component.name && `${component.name.charAt(0).toLowerCase()}${component.name.slice(1)}`) ||
    null
  );

  // default value for the actionsKey is stateKey (more convenient).
  const actionsKey = config.actionsKey || stateKey;

  // register reducer
  if (reducer && stateKey !== null) {
    registeredReducers[stateKey] = reducer;
  }

  // maps component state to component props
  const mapStateToProps = (stateKey === null ? null : state => ({
    [stateKey]: state[stateKey],
  }));

  // maps component actions to dispatchProps
  const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

  // combines component props, mapped props from state and mapped props from dispatchProps
  const combineProps = (stateProps, dispatchProps, ownProps) => {
    let actionProps = Object.assign({}, dispatchProps);

    if (actionsKey !== null) {
      actionProps = Object.assign(
        {},
        Object.assign({}, ownProps.actions),
        { [actionsKey]: dispatchProps },
      );
    }

    return Object.assign({}, ownProps, stateProps, { actions: actionProps });
  };

  // get the connected component
  const connectedComponent = reduxConnect(
    mapStateToProps,
    mapDispatchToProps,
    combineProps,
  )(component);

  // update the store to register the new reducer
  updateStore();

  return connectedComponent;
};

export default connect;
