/**
 * Dependency imports
 */
import { useSelector } from 'react-redux';

/**
 * Local imports
 */
import { createReducer } from './create';
import * as helpers from './helpers';

export default (name, newState) => {
  if (newState) {
    createReducer(name, newState);
    return newState;
  }

  return useSelector(globalState => helpers.queryState(name, globalState) ?? globalState);
};
