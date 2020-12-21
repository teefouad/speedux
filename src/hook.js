/**
 * Dependency imports.
 */
import { useSelector, useDispatch } from 'react-redux';

/**
 * Local imports.
 */
import Module from './module';
import store from './store';
import dispatch from './dispatch';
import * as helpers from './helpers';

/**
 * Error messages map
 */
export const ERRORS = {
  INVALID_CONFIG: 'Configuration must be a valid object.',
  MISSING_NAME: 'Property \'name\' is missing from the configuration. Name is required.',
  DUPLICATE_NAME: 'This name has already been used by another component, please use a different name.',
};

const moduleNames = {};

export default (config) => {
  if (helpers.getObjectType(config) !== 'object') {
    throw new Error(ERRORS.INVALID_CONFIG);
  }

  if (!config.name) {
    throw new Error(ERRORS.MISSING_NAME);
  }

  if (moduleNames[config.name] === true) {
    const { warn } = console;
    warn(`Duplicate name: ${config.name}. ${ERRORS.DUPLICATE_NAME}`);
  } else {
    moduleNames[config.name] = true;
  }

  const module = new Module(config);
  const initialState = config.initialState || config.state || {};

  store.useReducer(module.name, module.reducer, initialState);

  Object.values(module.sagas).forEach(saga => store.useSaga(saga));

  let shouldUpdateStore = true;

  return () => {
    if (shouldUpdateStore) {
      store.update();
      shouldUpdateStore = false;
    }

    const {
      [module.stateKey]: state,
      [module.globalStateKey]: globalState,
    } = module.mapStateToProps(useSelector(stateTree => stateTree));

    const actions = module.mapDispatchToProps(useDispatch());

    return {
      state,
      actions,
      dispatch,
      globalState,
    };
  };
};
