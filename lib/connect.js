'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connect = undefined;

var _react = require('react');

var _redux = require('redux');

var _reactRedux = require('react-redux');

var _store = require('./store');

var _reducer = require('./reducer');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * Dependency imports.
                                                                                                                                                                                                                   */


/**
 * Local imports.
 */


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
var connect = exports.connect = function connect(component) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (typeof component !== 'function' && Object.getPrototypeOf(component) !== _react.Component) {
    throw new Error('Function `connect` expects the first parameter to be a pure function or a valid React component class.');
  }

  // if no reducer is provided, use a simple reducer that returns the state as it is.
  var reducer = config.reducer || function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return state;
  };

  // default value for the actions object is an empty object (no actions).
  var actions = config.actions || {};

  // default value for the stateKey component display name or function name
  // (component is stateless)
  var stateKey = config.stateKey || component.displayName && '' + component.displayName.charAt(0).toLowerCase() + component.displayName.slice(1) || component.name && '' + component.name.charAt(0).toLowerCase() + component.name.slice(1) || null;

  // default value for the actionsKey is stateKey (more convenient).
  var actionsKey = config.actionsKey || stateKey;

  // register reducer
  if (reducer && stateKey !== null) {
    _reducer.registeredReducers[stateKey] = reducer;
  }

  // maps component state to component props
  var mapStateToProps = stateKey === null ? null : function (state) {
    return _defineProperty({}, stateKey, state[stateKey]);
  };

  // maps component actions to dispatchProps
  var mapDispatchToProps = function mapDispatchToProps(dispatch) {
    return (0, _redux.bindActionCreators)(actions, dispatch);
  };

  // combines component props, mapped props from state and mapped props from dispatchProps
  var combineProps = function combineProps(stateProps, dispatchProps, ownProps) {
    var actionProps = Object.assign({}, dispatchProps);

    if (actionsKey !== null) {
      actionProps = Object.assign({}, Object.assign({}, ownProps.actions), _defineProperty({}, actionsKey, dispatchProps));
    }

    return Object.assign({}, ownProps, stateProps, { actions: actionProps });
  };

  // get the connected component
  var connectedComponent = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps, combineProps)(component);

  // update the store to register the new reducer
  (0, _store.updateStore)();

  return connectedComponent;
};

exports.default = connect;