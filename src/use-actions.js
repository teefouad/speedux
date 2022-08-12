/**
 * Local imports
 */
import lookbook from './lookbook';
import store from './store';
import useDispatch from './use-dispatch';
import * as helpers from './helpers';

export default (name) => {
  const actions = {};
  const dispatch = useDispatch(name);

  if (lookbook.actions[name]) {
    Object.keys(lookbook.actions[name]).forEach((actionName) => {
      actions[actionName] = (...args) => new Promise((resolve) => {
        const actionType = `@@${name}/${helpers.toSnakeCase(actionName).toUpperCase()}/COMPLETE`;
        const listener = () => {
          store.unsubscribe(actionType, listener);
          resolve();
        };
        store.subscribe(actionType, listener);
        dispatch(actionName, ...args);
      });
    });
  }

  return actions;
};
