/**
 * Dependency imports
 */
import { useSelector } from 'react-redux';

/**
 * Local imports
 */
import { createReducer } from './create';

export default (name, newState) => {
  if (newState) {
    createReducer(name, newState);
    return newState;
  }

  return useSelector(globalState => globalState[name] ?? globalState);
};
