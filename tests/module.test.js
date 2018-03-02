import thunkMiddleware from 'redux-thunk';
import configureStore from 'redux-mock-store';

import Module from '../src/module';

const mockStore = configureStore([thunkMiddleware]);

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
    const module = new Module('test');
    expect(module.name).toBe('test');
  });

  it('should have an initial state by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('initialState', expect.any(Object));
  });

  it('should set a reference to the initial state from the constructor', () => {
    const module = new Module('test', mockState());
    expect(module.initialState).toEqual(mockState());
  });

  it('should not copy the initial state by reference', () => {
    const state = mockState();
    const module = new Module('test', state);
    expect(module.initialState).not.toBe(state);
  });

  it('should set a reference to the store object from the constructor', () => {
    const store = mockStore();
    const module = new Module('test', mockState(), store);
    expect(module.store).toBe(store);
  });

  it('should have an actions key by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('actions', expect.any(Object));
  });

  it('should have a state key and actions key equal to the module name', () => {
    const module = new Module('test');
    expect(module).toHaveProperty('stateKey', 'test');
    expect(module).toHaveProperty('actionsKey', 'test');
  });

  it('should have a reference to an empty types hash table by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('types', {});
  });

  it('should have a reference to an empty action creators hash table by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('actions', {});
  });

  it('should map the action name to the prefixed action type', () => {
    const module = new Module('test');
    module.createAction('doSomething');
    expect(module.types.DO_SOMETHING).not.toBeUndefined();
    expect(module.types.DO_SOMETHING).toBe('@@test/DO_SOMETHING');
  });

  it('should have a reference to an empty sub reducers hash table by default', () => {
    const module = new Module();
    expect(module).toHaveProperty('subReducers', {});
  });

  it('should have a reference to a reducer function that returns the initial state when called without any parameters', () => {
    const module = new Module();
    expect(module.reducer()).toBe(module.initialState);
  });

  it('should have a reference to a reducer function that returns the same state for unknown actions', () => {
    const module = new Module('test');
    const state = mockState();
    const newState = module.reducer(state, { type: 'FOO' });
    expect(newState).toBe(state);
  });

  it('should have a reference to a reducer function that returns a different state for known actions', () => {
    const state = mockState();
    const module = new Module('test', state, mockStore({ test: state }));
    module.createAction('change_foo', () => ({
      foo: 'newBaz',
    }));
    const newState = module.reducer(state, module.actions.changeFoo());
    expect(newState).toHaveProperty('foo', 'newBaz');
  });

  it('should have a getState method', () => {
    const module = new Module();
    expect(module).toHaveProperty('getState', expect.any(Function));
  });

  it('should allow getting the entire state object', () => {
    const state = mockState();
    const module = new Module('test', state, mockStore({ test: state }));
    expect(module.getState()).toEqual(state);
  });

  it('should allow reading a state value using a query string', () => {
    const state = mockState();
    const module = new Module('test', state, mockStore({ test: state }));
    expect(module.getState('foo')).toBe('baz');
  });

  it('should allow reading a nested state value using a query string', () => {
    const state = mockState();
    const module = new Module('test', state, mockStore({ test: state }));
    expect(module.getState('nested.props.foo')).toBe('baz');
  });

  it('should allow reading a state value inside an array using a query string', () => {
    const state = mockState();
    const module = new Module('test', state, mockStore({ test: state }));
    expect(module.getState('nested.props.fruits[1]')).toBe('orange');
    expect(module.getState('nested.props.fruits[2].name')).toBe('banana');
  });

  it('should allow reading parts of the state using a query object', () => {
    const state = mockState();
    const module = new Module('test', state, mockStore({ test: state }));
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
    const module = new Module('test');
    module.createAction('FOO');
    expect(module).toHaveProperty('types.FOO', '@@test/FOO');
  });

  it('should create an action creator after calling createAction', () => {
    const module = new Module('test');
    module.createAction('CHANGE_FOO');
    expect(module).toHaveProperty('actions.changeFoo', expect.any((Function)));
  });

  it('should be able map the action callback parameters to the payload object', () => {
    const module = new Module('test');
    module.createAction('CHANGE_FOO', (paramA, paramB) => ({ paramA, paramB }));
    expect(module.actions.changeFoo(10, 20)).toEqual({
      type: '@@test/CHANGE_FOO',
      payload: {
        paramA: 10,
        paramB: 20,
      },
    });
  });

  it('should create a sub reducer function after calling createAction', () => {
    const module = new Module('test');
    module.createAction('CHANGE_FOO');
    expect(module).toHaveProperty('subReducers.@@test/CHANGE_FOO', expect.any((Function)));
  });

  it('should create a sub reducer function that returns the same state for unknown actions', () => {
    const module = new Module('test');
    module.createAction('CHANGE_FOO');
    const state = {};
    const newState = module.subReducers['@@test/CHANGE_FOO'](state, {
      type: 'CHANGE_BAZ',
    });
    expect(newState).toBe(state);
  });

  it('should create a sub reducer function that returns a different state for known actions', () => {
    const module = new Module('test');
    module.createAction('CHANGE_FOO');
    const state = mockState();
    const newState = module.subReducers['@@test/CHANGE_FOO'](state, {
      type: '@@test/CHANGE_FOO',
    });
    expect(newState).not.toBe(state);
  });

  it('should allow using a single word as an action name', () => {
    const module = new Module('test');
    module.createAction('FOO');
    expect(module).toHaveProperty('actions.foo', expect.any(Function));
  });

  it('should allow using underscores in the action name', () => {
    const module = new Module('test');
    module.createAction('FIRST_action');
    expect(module).toHaveProperty('actions.firstAction', expect.any(Function));
  });

  it('should allow using dashes in the action name', () => {
    const module = new Module('test');
    module.createAction('do-something');
    expect(module).toHaveProperty('actions.doSomething', expect.any(Function));
  });

  it('should allow using spaces in the action name', () => {
    const module = new Module('test');
    module.createAction('buy milk');
    expect(module).toHaveProperty('actions.buyMilk', expect.any(Function));
  });

  it('should have a handleAction method', () => {
    const module = new Module();
    expect(module).toHaveProperty('handleAction', expect.any(Function));
  });
});
