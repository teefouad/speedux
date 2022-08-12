import { Store, Action, Middleware } from 'redux';

declare module 'speedux' {
  export type GlobalStateUpdate<T> = Partial<T> | ((prevState: T) => Partial<T>);

  export type GlobalStateUpdater<T> = (...args) => GlobalStateUpdate<T>;

  export type Yieldable<T> = GlobalStateUpdate<T> | Promise<unknown>;

  export type AsyncGlobalStateUpdater<T> = (...args) => Generator<Yieldable<T>, void, unknown>;

  export type GlobalStateObject = {
    [path: string]: any;
  };

  export type GlobalStateActions<T, U> = {
    [Property in keyof U]: U[Property] extends (...args: any[]) => Promise<void> ? AsyncGlobalStateUpdater<T> : GlobalStateUpdater<T>;
  };

  /**
   * An object that describes the global state and the actions and handlers
   * associated to it.
   */
  export type GlobalStateConfig<TState extends GlobalStateObject, TActions> = {
    /**
     * Key that should be used to create this global state in the Redux store.
     */
    name: string;
    /**
     * The initial value for the global state.
     */
    state?: TState;
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
    actions?: GlobalStateActions<TState, TActions>;
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
    handlers?: {
      [actionType: string]: (action: Action) => GlobalStateUpdate<TState>;
    };
  };

  export type DispatchFunction = {
    (action: string | Action): void;
  };

  export type HandlerCallback = {
    (action: Action): void;
  };

  export type ExecuteFunction<T> = (...args) => Promise<T>;

  export type CancelFunction = () => void;

  export type ReducerFunction<T> = {
    (state: T, action: Action): T;
  };

  /**
   * Creates a new global state branch in the Redux store.
   * @param config An object that describes the global state and the actions and handlers associated to it.
   */
  export function createGlobalState<T, U>(config: GlobalStateConfig<T, U>): {
    useState: (query?: string) => T,
    useActions: () => U,
  };

  /**
   * Returns a piece of global state from the store. This is a hook function and can only be used inside a component.
   * @param query Name of global state to read or a query string.
   * @returns The global state object that corresponds to the query.
   */
  export function useGlobalState<T>(query?: string): T;

  /**
   * Returns a piece of global state from the store based on the provided query.
   * @param query Query string.
   * @returns The global state object that corresponds to the query.
   */
  export function queryGlobalState<T>(query?: string): T;

  /**
   * Returns a list of dispatcher functions that correspond to the configured `actions` field.
   * @param name Name of the global state to which the actions are associated.
   */
  export function useActions<T>(name: string): T;

  /**
   * Returns a `dispatch` function which can be used to dispatch actions.
   * @param name Name of the global state to which the dispatched actions should be associated.
   */
  export function useDispatch(name?: string): DispatchFunction;

  /**
   * Allows listening to any action dispatched by the Redux store.
   * @param actionType Type of the action to listen to.
   * @param callback Function to be called when the action is dispatched.
   */
  export function useHandler(actionType: string, callback: HandlerCallback): void;

  /**
   * Allows using a generator function to manipulate a state object asynchronously, similar to how async actions work.
   * @param generatorFunction Generator function to consume.
   * @param initialState Initial state value.
   */
  export function useAsync<T>(
    generatorFunction: AsyncStateFunction,
    initialState?: T,
  ): [T, ExecuteFunction<T>, CancelFunction];

  /**
   * Allows registering a reducer function that can listen to any action
   * dispatched by the store and modify the global state accordingly.
   * @param key A unique identifier key for the reducer.
   * @param reducer Reducer function to use.
   * @param initialState Initial value for the state.
   */
  export function useReducer(
    key: string,
    reducer: ReducerFunction,
    initialState: GlobalStateObject,
  ): void;

  /**
   * Allows using middleware functions such as React Router middleware and others.
   * @param middleware Middleware function to use.
   */
  export function useMiddleware(middleware: Middleware): void;

  export function Provider(props: any): any;

  export namespace store {
    export function create(): Store;
    export function getInstance(): Store;
  }
}
