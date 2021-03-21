/**
 * Local imports
 */
import store from './store';

/**
 * Re-exports
 */
export { default as createGlobalState } from './create';
export { default as useGlobalState } from './use-global-state';
export { default as useActions } from './use-actions';
export { default as useHandler } from './use-handler';
export { default as useDispatch } from './use-dispatch';
export { default as useGenerator } from './use-generator';
export { default as Provider } from './provider';
export { default as store } from './store';

export const useReducer = (...args) => { store.useReducer(...args); store.update(); };
export const useMiddleware = (...args) => store.useMiddleware(...args);

store.create();
