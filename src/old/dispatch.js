/**
 * Local imports.
 */
import store from './store';
import * as helpers from './helpers';

/**
 * Dispatches an action. It may accepts two or three parameters:
 * dispatch(actionType, payload);
 * dispatch(actionObject);
 * @param   {String}  actionType    Type of the action to be dispatched
 * @param   {Object}  payload       Action payload object
 * @param   {Object}  actionObject  Normal action object that contains a 'type' property
 */
function dispatch(...args) {
  let action = {};

  if (helpers.getObjectType(args[0]) === 'object') {
    action = helpers.deepCopy(args[0]);
  } else
  if (helpers.getObjectType(args[0]) === 'string') {
    // set the type
    if (/^([^.]*?)\.([^.]*?)$/.test(args[0])) {
      const [moduleName, moduleAction] = args[0].split('.');
      const camelCaseName = helpers.toCamelCase(moduleAction);
      const actionName = helpers.toSnakeCase(camelCaseName).toUpperCase();
      action.type = `@@${moduleName}/${actionName}`;
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

  store.getInstance().dispatch(action);
}

export default dispatch;
