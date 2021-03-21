/**
 * Local imports
 */
import { lookbook } from './create';
import useDispatch from './use-dispatch';

export default (name) => {
  const actions = {};
  const dispatch = useDispatch(name);

  Object.keys(lookbook.actions[name]).forEach((actionName) => {
    actions[actionName] = (...args) => {
      dispatch(actionName, ...args);
    };
  });

  return actions;
};
