/**
 * Dependency imports
 */
import { useEffect } from 'react';

/**
 * Local imports
 */
import store from './store';
import * as helpers from './helpers';

export default (actionType, handler) => {
  let targetActionType = actionType;

  if (/^(.*?)\.(.*?)$/.test(actionType)) {
    const [actionPrefix, actionSuffix] = actionType.split('.');
    targetActionType = `@@${actionPrefix}/${helpers.toSnakeCase(actionSuffix).toUpperCase()}`;
  }

  useEffect(() => {
    store.subscribe(targetActionType, handler);

    return () => {
      store.unsubscribe(targetActionType, handler);
    };
  }, []);
};
