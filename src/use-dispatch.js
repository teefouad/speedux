/**
 * Dependency imports
 */
import { getType, deepCopy } from 'noyb';

/**
 * Local imports
 */
import store from './store';
import * as helpers from './helpers';

/**
 * Dispatching normal actions
 * ===
 * Hook that returns a `dispatch` function. This `dispatch` function
 * is used to dispatch normal action objects.
 *
 * dispatch(actionObject);
 *
 * @param   {Object}  actionObject  Normal action object that contains
 *                                  a 'type' property
 * Example:
 * dispatch({ type: 'ADD_ITEM', itemId: 1 });
 *
 *
 *
 * Dispatching defined actions
 * ===
 * Or it can be used to dispatch an action that was defined using the
 * createGlobalState function.
 *
 * dispatch(actionType, ...args);
 *
 * @param   {String}  actionType    Type of the action to be dispatched
 * @param   {*}       args          Arguments to be passed to the action
 *
 * Example:
 * dispatch('cart.addItem', 134, 'Leather belt', '$55');
 *
 *
 *
 * Getting a specific dispatch function
 * ===
 * You can pass the name of the global state to get a dispatch function
 * that works specifically with that piece of state.
 *
 * const dispatch = useDispatch(name);
 *
 * @param   {String}  name          Name of a defined global state
 *
 * Example:
 * const dispatch = useDispatch('cart');
 * dispatch('addItem', 134, 'Leather belt', '$55');
 */
export default name => (...args) => {
  let action = {};

  if (getType(args[0]) === 'object') {
    action = deepCopy(args[0]);
  } else
  if (getType(args[0]) === 'string') {
    // set the type
    if (name) {
      action.type = `@@${name}/${helpers.toSnakeCase(args[0]).toUpperCase()}`;
    } else
    if (/^([^.]*?)\.([^.]*?)$/.test(args[0])) {
      const [prefix, actionName] = args[0].split('.');
      action.type = `@@${prefix}/${helpers.toSnakeCase(actionName).toUpperCase()}`;
    } else {
      [action.type] = args;
    }

    // set the payload
    action.payload = {};

    // set the args
    if (args.length > 1) {
      action.args = args.slice(1);
    }
  }

  return store.getInstance().dispatch(action);
};
