/**
 * Dependency imports
 */
import { useSelector } from 'react-redux';
import { queryObject } from 'noyb';

export default query => useSelector(
  globalState => (query ? queryObject(query, globalState) : globalState),
);
