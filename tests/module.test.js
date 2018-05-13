import configureStore from 'redux-mock-store';
import { takeLatest, put } from 'redux-saga/effects';

import Module from '../src/module';

const mockStore = configureStore();

const mockState = state => ({
  loading: false,
  foo: 'baz',
  anotherFoo: 'anotherBaz',
  tags: ['tag-1', 'tag-2', 'tag-3'],
  nested: {
    props: {
      foo: 'baz',
      count: 200,
      fruits: ['apple', 'orange', {
        name: 'banana',
      }],
    },
  },
  ...state,
});

describe('module.js', () => {
  it('should set the module name from the constructor', () => {
    const module = new Module({
      name: 'test',
    });
    expect(module.name).toBe('test');
  });

  it('should have an initial state by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('initialState', expect.any(Object));
  });

  it('should set a reference to the initial state from the constructor', () => {
    const module = new Module({
      initialState: mockState(),
    });
    expect(module.initialState).toEqual(mockState());
  });

  it('should not copy the initial state by reference', () => {
    const state = mockState();
    const module = new Module({
      initialState: state,
    });
    expect(module.initialState).not.toBe(state);
  });

  it('should set a reference to the store object from the constructor', () => {
    const store = mockStore();
    const module = new Module({
      store,
    });
    expect(module.store).toBe(store);
  });

  it('should have a default value for the state key', () => {
    const module = new Module();
    expect(module).toHaveProperty('stateKey', 'state');
  });

  it('should have a configurable state key that has a default value', () => {
    const module = new Module({
      stateKey: 'test',
    });
    expect(module).toHaveProperty('stateKey', 'test');
  });

  it('should have a default value for the actions key', () => {
    const module = new Module();
    expect(module).toHaveProperty('actionsKey', 'actions');
  });

  it('should have a configurable actions key that has a default value', () => {
    const module = new Module({
      actionsKey: 'test',
    });
    expect(module).toHaveProperty('actionsKey', 'test');
  });

  it('should have an empty types hash table by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('types', {});
  });

  it('should create a new type for a given action', () => {
    const module = new Module({
      name: 'test',
      actions: {
        fooBaz() { },
      },
    });
    expect(module.types).toHaveProperty('FOO_BAZ', '@@test/FOO_BAZ');
  });

  it('should have an empty action creators hash table by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('actionCreators', expect.any(Object));
  });

  it('should build an action creator function for each given action', () => {
    const module = new Module({
      actions: {
        foo() { },
        baz() { },
      },
    });
    expect(module.actionCreators).toMatchObject({
      foo: expect.any(Function),
      baz: expect.any(Function),
    });
  });

  it('should build a valid action creator function for a given action', () => {
    const module = new Module({
      actions: {
        foo(paramA, paramB) { return [paramA, paramB]; },
      },
    });
    const actionObject = module.actionCreators.foo('a', 'b');
    expect(actionObject).toMatchObject({
      type: 'FOO',
      payload: {
        paramA: 'a',
        paramB: 'b',
      },
    });
  });

  it('should have a reference to an empty sub reducers hash table by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('reducers', {});
  });

  it('should have a reference to a reducer function that returns the initial state when called without any parameters', () => {
    const module = new Module();
    expect(module.reducer()).toBe(module.initialState);
  });

  it('should have a reference to a reducer function that returns the same state for unknown actions', () => {
    const module = new Module();
    const state = mockState();
    const newState = module.reducer(state, { type: 'FOO' });
    expect(newState).toBe(state);
  });

  it('should have a reference to a reducer function that returns a different state for known actions', () => {
    const state = mockState();
    const module = new Module({
      initialState: state,
      actions: {
        changeFoo: () => ({
          foo: 'newBaz',
        }),
      },
    });
    const newState = module.reducer(state, module.actionCreators.changeFoo());
    expect(newState).toHaveProperty('foo', 'newBaz');
  });

  it('should build a sub reducer function for each given action', () => {
    const module = new Module({
      actions: {
        handleFoo() { },
      },
    });
    expect(module.reducers).toHaveProperty('HANDLE_FOO', expect.any(Function));
  });

  it('should build a sub reducer function that can handle a given action', () => {
    const module = new Module({
      actions: {
        handleFoo() {
          return {
            foo: 'fiz',
          };
        },
      },
    });
    const state = { foo: 'baz' };
    const newState = module.reducer(state, {
      type: 'HANDLE_FOO',
    });
    expect(newState).toMatchObject({
      foo: 'fiz',
    });
  });

  it('should build a sub reducer function that ignores unknown actions', () => {
    const module = new Module({
      actions: {
        handleFoo() {
          return {
            foo: 'fiz',
          };
        },
      },
    });
    const state = { foo: 'baz' };
    const newState = module.reducer(state, {
      type: 'UNKNOWN_ACTION',
    });
    expect(newState).toBe(state);
  });

  it('should have an empty sagas hash table by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('sagas', {});
  });

  it('should build a saga worker for a given action', () => {
    const module = new Module({
      actions: {
        * handleAsync() {
          yield { foo: 1 };
          yield { foo: 2 };
        },
      },
    });
    expect(module.sagas).toHaveProperty('HANDLE_ASYNC', expect.any(Function));
  });

  it('should properly advance a provided saga generator', () => {
    const module = new Module({
      actions: {
        * handleAsync() {
          yield { foo: 1 };
          yield { foo: 2 };
        },
      },
    });

    module.reducer({ foo: 0 }, {
      type: 'HANDLE_ASYNC',
    });

    const sagaGenerator = module.sagas.HANDLE_ASYNC();
    expect(sagaGenerator.next().value).toEqual(takeLatest('HANDLE_ASYNC', expect.any(Function)));

    const workerSagaGenerator = module.workerSagas.HANDLE_ASYNC({
      type: 'HANDLE_ASYNC',
    });

    expect(workerSagaGenerator.next().value).toEqual(put({
      type: 'HANDLE_ASYNC/UPDATE',
      payload: { foo: 1 },
    }));

    expect(workerSagaGenerator.next().value).toEqual(put({
      type: 'HANDLE_ASYNC/UPDATE',
      payload: { foo: 2 },
    }));

    expect(workerSagaGenerator.next().value).toEqual(put({
      type: 'HANDLE_ASYNC/COMPLETE',
    }));

    expect(workerSagaGenerator.next().done).toBe(true);
  });

  it('should be able to read the state inside an action handler', (done) => {
    expect.assertions(1);

    const module = new Module({
      name: 'test',
      store: {
        getState: () => ({ test: { foo: 10 } }),
      },
      actions: {
        readFoo() {
          expect(this.state.foo).toBe(10);
          done();
        },
      },
    });

    module.reducer(module.initialState, {
      type: '@@test/READ_FOO',
    });
  });

  it('should be able to read the state inside an async action handler', (done) => {
    const module = new Module({
      name: 'test',
      store: {
        getState: () => ({ test: { foo: 10 } }),
      },
      actions: {
        * readFoo() {
          expect(this.state.foo).toBe(10);
          yield done();
        },
      },
    });

    module.reducer(module.initialState, {
      type: '@@test/READ_FOO',
    });

    // advance the saga
    module.sagas['@@test/READ_FOO']().next();

    // advance the worker saga
    module.workerSagas['@@test/READ_FOO']({
      type: '@@test/READ_FOO',
    }).next();
  });

  it('should be able to change the state from an action handler', () => {
    const module = new Module({
      state: {
        foo: 'baz',
      },
      actions: {
        changeFoo() {
          return { foo: 'fiz' };
        },
      },
    });

    const newState = module.reducer(module.initialState, {
      type: 'CHANGE_FOO',
    });

    expect(newState).toHaveProperty('foo', 'fiz');
  });

  it('should have a getState method', () => {
    const module = new Module();
    expect(module).toHaveProperty('getState', expect.any(Function));
  });

  it('should allow getting the entire state object', () => {
    const state = mockState();
    const module = new Module({
      name: 'test',
      initialState: state,
      store: mockStore({ test: state }),
    });
    expect(module.getState()).toEqual(state);
  });

  it('should allow reading a state value using a query string', () => {
    const state = mockState();
    const module = new Module({
      name: 'test',
      initialState: state,
      store: mockStore({ test: state }),
    });
    expect(module.getState('foo')).toBe('baz');
  });

  it('should allow reading a nested state value using a query string', () => {
    const state = mockState();
    const module = new Module({
      name: 'test',
      initialState: state,
      store: mockStore({ test: state }),
    });
    expect(module.getState('nested.props.foo')).toBe('baz');
  });

  it('should allow reading a state value inside an array using a query string', () => {
    const state = mockState();
    const module = new Module({
      name: 'test',
      initialState: state,
      store: mockStore({ test: state }),
    });
    expect(module.getState('nested.props.fruits[1]')).toBe('orange');
    expect(module.getState('nested.props.fruits[2].name')).toBe('banana');
  });

  it('should allow reading parts of the state using a query object', () => {
    const state = mockState();
    const module = new Module({
      name: 'test',
      initialState: state,
      store: mockStore({ test: state }),
    });
    const stateObject = module.getState({
      tagThree: 'tags[2]',
      apple: 'nested.props.fruits[0]',
    });
    expect(stateObject).toEqual({
      tagThree: 'tag-3',
      apple: 'apple',
    });
  });

  it('should have a createAction method', () => {
    const module = new Module();
    expect(module).toHaveProperty('createAction', expect.any(Function));
  });

  it('should create a new action type after calling createAction', () => {
    const module = new Module({ name: 'test' });
    module.createAction('FOO');
    expect(module.types).toHaveProperty('FOO', '@@test/FOO');
  });

  it('should create an action creator after calling createAction', () => {
    const module = new Module();
    module.createAction('CHANGE_FOO');
    expect(module.actionCreators).toHaveProperty('changeFoo', expect.any((Function)));
  });

  it('should be able map the action callback parameters to the payload object', () => {
    const module = new Module({ name: 'test' });
    module.createAction('CHANGE_FOO', (paramA, paramB) => ({ paramA, paramB }));
    expect(module.actionCreators.changeFoo(10, 20)).toEqual({
      type: '@@test/CHANGE_FOO',
      payload: {
        paramA: 10,
        paramB: 20,
      },
    });
  });

  it('should create a sub reducer function after calling createAction', () => {
    const module = new Module({ name: 'test' });
    module.createAction('CHANGE_FOO');
    expect(module.reducers).toHaveProperty('@@test/CHANGE_FOO', expect.any((Function)));
  });

  it('should allow using a single word as an action name', () => {
    const module = new Module();
    module.createAction('FOO');
    expect(module.actionCreators).toHaveProperty('foo', expect.any(Function));
  });

  it('should allow using underscores in the action name', () => {
    const module = new Module();
    module.createAction('FIRST_action');
    expect(module.actionCreators).toHaveProperty('firstAction', expect.any(Function));
  });

  it('should allow using dashes in the action name', () => {
    const module = new Module();
    module.createAction('do-something');
    expect(module.actionCreators).toHaveProperty('doSomething', expect.any(Function));
  });

  it('should allow using spaces in the action name', () => {
    const module = new Module();
    module.createAction('buy milk');
    expect(module.actionCreators).toHaveProperty('buyMilk', expect.any(Function));
  });

  it('should have a handleAction method', () => {
    const module = new Module();
    expect(module).toHaveProperty('handleAction', expect.any(Function));
  });
});
