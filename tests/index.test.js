import React from 'react';
import renderer from 'react-test-renderer';
import configureStore from 'redux-mock-store';

import {
  store,
  addReducer,
  useMiddleware,
  connect,
  createModule,
  Provider,
} from '../src';

describe('index.js', () => {
  const mockStore = configureStore();
  const getMockComponent = () => class FakeComponent extends React.Component {
    doSomething() {
      this.done = true;
    }

    render() {
      return <div />;
    }
  };

  it('should export store, provider, public methods, connect and createModule', () => {
    expect(store).toBeInstanceOf(Object);
    expect(addReducer).toBeInstanceOf(Function);
    expect(useMiddleware).toBeInstanceOf(Function);
    expect(connect).toBeInstanceOf(Function);
    expect(createModule).toBeInstanceOf(Function);
    expect(Provider).toBeInstanceOf(Object);
  });

  it('should throw an error if createModule is called with an invalid configuration', () => {
    const fn = () => createModule('invalid configuration');
    expect(fn).toThrow();
  });

  it('should not copy config or any of its properties by reference', () => {
    const config = {
      initialState: {
        foo: 'baz',
        fiz: {
          fa: 'biz',
        },
      },
    };
    const module = createModule(config);
    expect(module.currentConfig.initialState).toEqual(config.initialState);
    expect(module.currentConfig.initialState).not.toBe(config.initialState);
    expect(module.currentConfig.initialState.fiz).toEqual(config.initialState.fiz);
    expect(module.currentConfig.initialState.fiz).not.toBe(config.initialState.fiz);
  });

  it('should inject an empty object to the state prop if no initial state is provided', () => {
    const module = createModule({ stateKey: 'testState' });
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('testState', {});
  });

  it('should inject an empty object to the actions prop if no actions are provided', () => {
    const module = createModule({ actionsKey: 'testActions' });
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('testActions', {});
  });

  it('should be able to set the state prop key', () => {
    const module = createModule({ stateKey: 'testState' });
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('testState', {});
  });

  it('should be able to set the actions prop key', () => {
    const module = createModule({ actionsKey: 'testActions' });
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('testActions', {});
  });

  it('should set the state key to `state` by default', () => {
    const module = createModule();
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('state', {});
  });

  it('should set the actions key to `actions` by default', () => {
    const module = createModule();
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('actions', {});
  });

  it('should inject the initial state into the component props', () => {
    const module = createModule({
      initialState: {
        foo: 'baz',
        fiz: 'biz',
        fa: { fae: 'boo' },
      },
    });
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('state', {
      foo: 'baz',
      fiz: 'biz',
      fa: { fae: 'boo' },
    });
  });

  it('should inject the action creators into the component props', () => {
    const module = createModule({
      actions: {
        foo() {},
        fiz() {},
        * fa() { yield null; },
      },
    });
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props).toHaveProperty('actions', {
      foo: expect.any(Function),
      fiz: expect.any(Function),
      fa: expect.any(Function),
    });
  });

  it('should set the name of the module to the component name in camelcase, if the name is not provided', () => {
    const module = createModule();
    connect(getMockComponent(), module);
    expect(module.name).toBe('fakeComponent');
  });

  it('should be able to dispatch an action from the component props', () => {
    const module = createModule({
      actions: {
        foo() { },
      },
    });
    const ConnectedComponent = connect(getMockComponent(), module);
    const fakeStore = mockStore({ fakeComponent: module.initialState });
    const instance = renderer.create(<ConnectedComponent store={fakeStore} />);
    expect(instance.root.children[0].props.actions.foo()).toMatchObject({
      type: '@@fakeComponent/FOO',
      payload: {},
    });
  });

  xit('should call a provided action callback after calling the action from the component props', () => {
  });

  xit('should be able to update the state when an action is called', () => {
  });

  xit('should advance a generator function that is provided as an action callback', () => {
  });

  xit('should be able to handle an external action', () => {
  });

  xit('should advance a generator function that is provided as an external action callback', () => {
  });

  xit('should be able to update the module config at any time', () => {
  });

  xit('should throw an error if an action is dispatched with no store reference', () => {
  });
});
