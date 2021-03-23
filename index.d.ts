import { Store, Action, Middleware } from 'redux';

declare module 'speedux' {
  declare type GlobalStateObject = {
    [path: string]: any;
  };

  declare type GlobalStateActionsList = {
    [actionName: string]: (...args) => GlobalStateObject;
  };

  declare type GlobalStateHandlersList = {
    [actionType: string]: (action: Action) => GlobalStateObject;
  };

  declare type ActionDispatchers = {
    [actionName: string]: () => void;
  };

  declare type DispatchFunction = {
    (action: string | Action): void;
  };

  declare type HandlerCallback = {
    (action: Action): void;
  };

  declare type ReducerFunction = {
    (state: GlobalStateObject, action: Action): GlobalStateObject;
  };

  /**
   * An object that describes the global state and the actions and handlers
   * associated to it.
   */
  declare type GlobalStateConfig = {
    /**
     * Key that should be used to create this global state in the Redux store.
     */
    name: string;
    /**
     * The initial value for the global state.
     */
    state?: GlobalStateObject;
    /**
     * A list of actions that describe how this global state should be changed.
     * 
     * Example:
     * ```
     * {
     *    // update state by returning an object
     *    set: (newValue) => ({ value: newValue }),
     *
     *    // update depending on previous state
     *    increaseValue: () => (prevState) => ({
     *      value: prevState.value + 1,
     *    }),
     * }
     * ```
     */
    actions?: GlobalStateActionsList;
    /**
     * A list of handlers that describe how this global state should be changed in response to these actions.
     * 
     * Example:
     * ```
     * {
     *    // normal actions
     *    '@@router/REDIRECT': () => ({ redirected: true }),
     *    'ITEM_ADDED': (action) => ({ itemId: action.itemId }),
     *
     *    // actions defined in a configuration
     *    'foo.someAction': (action) => ({ message: action.message }),
     * }
     * ```
     */
    handlers?: GlobalStateHandlersList;
  };

  /**
   * Creates a new global state branch in the Redux store.
   * @param config An object that describes the global state and the actions and handlers associated to it.
   */
  declare function createGlobalState(config: GlobalStateConfig): void;

  /**
   * Returns a piece of global state from the store. This is a hook function and can only be used inside a component.
   * @param query Name of global state to read or a query string.
   * @returns The global state object that corresponds to the query.
   */
  declare function useGlobalState(query: string): GlobalStateObject;

  /**
   * Returns a piece of global state from the store based on the provided query.
   * @param query Query string.
   * @returns The global state object that corresponds to the query.
   */
  declare function queryGlobalState(query: string): GlobalStateObject;

  /**
   * Returns a list of dispatcher functions that correspond to the configured `actions` field.
   * @param name Name of the global state to which the actions are associated.
   */
  declare function useActions(name: string): ActionDispatchers;

  /**
   * Returns a `dispatch` function which can be used to dispatch actions.
   * @param name Name of the global state to which the dispatched actions should be associated.
   */
  declare function useDispatch(name?: string): DispatchFunction;

  /**
   * Allows listening to any action dispatched by the Redux store.
   * @param actionType Type of the action to listen to.
   * @param callback Function to be called when the action is dispatched.
   */
  declare function useHandler(actionType: string, callback: HandlerCallback): void;

  /**
   * Allows consuming a generator function, similar to how async actions work.
   * @param generatorFunction Generator function to consume.
   */
  declare function useGenerator(generatorFunction: GeneratorFunction): any;

  /**
   * Allows registering a reducer function that can listen to any action
   * dispatched by the store and modify the global state accordingly.
   * @param key A unique identifier key for the reducer.
   * @param reducer Reducer function to use.
   * @param initialState Initial value for the state.
   */
  declare function useReducer(
    key: string,
    reducer: ReducerFunction,
    initialState: GlobalStateObject,
  ): void;

  /**
   * Allows using middleware functions such as React Router middleware and others.
   * @param middleware Middleware function to use.
   */
  declare function useMiddleware(middleware: Middleware): any;

  declare function Provider(props: any): any;

  declare namespace store {
    declare function create(): Store;
    declare function getInstance(): Store;
  }
}
