import React from 'react';
import renderer from 'react-test-renderer';
import configureStore from 'redux-mock-store';

import Connector from '../src/connector';

describe('connect.js', () => {
  const mockStore = configureStore();
  const getMockComponent = () => class MockComponent extends React.Component {
    doSomething() {
      this.done = true;
    }

    render() {
      return <div />;
    }
  };

  beforeEach(() => {
    Connector.storeManager = null;
  });

  it('should have a `use` method', () => {
    expect(Connector).toHaveProperty('use', expect.any(Function));
  });

  it('should have a `connect` method', () => {
    expect(Connector).toHaveProperty('connect', expect.any(Function));
  });

  it('should be able to use a given StoreManager', () => {
    const storeManager = {};
    Connector.use(storeManager);
    expect(Connector.storeManager).toBe(storeManager);
  });

  it('should throw an error if the passed component is not a valid React component definition', () => {
    const fn = () => {
      Connector.connect('invalid component');
    };

    expect(fn).toThrowError('Expected the first parameter to be a pure function or a valid React component class.');
  });

  it('should throw an error if the passed config is not a valid object', () => {
    const fn = () => {
      Connector.connect(() => null, 'invalid config');
    };

    expect(fn).toThrowError('Expected the second parameter to be a valid object.');
  });

  it('should throw an error if connect() is called without using a StoreManager', () => {
    const fn = () => {
      Connector.connect(() => null, {});
    };

    expect(fn).toThrowError('Expected a valid StoreManager to be used before calling `connect`.');
  });

  it('should should add the configured reducer', () => {
    Connector.use({
      addReducer: jest.fn(),
    });

    const reducer = (state = {}) => state;

    Connector.connect(getMockComponent(), {
      name: 'test',
      reducer,
    });

    expect(Connector.storeManager.addReducer).toHaveBeenCalledWith('test', reducer);
  });

  it('should should inject an actions object into the props using a valid actionsKey', () => {
    Connector.use({
      update: () => null,
      addReducer: () => null,
    });

    const ConnectedComponent = Connector.connect(getMockComponent(), {
      actionsKey: 'test',
    });
    const instance = renderer.create(<ConnectedComponent store={mockStore()} />);

    expect(instance.root.children[0].props).toHaveProperty('test', expect.any(Object));
  });

  it('should map action creators to the action object that is injected into the props', () => {
    Connector.use({
      update: () => null,
      addReducer: () => null,
    });

    const ConnectedComponent = Connector.connect(getMockComponent(), {
      actionsKey: 'test',
      actionCreators: {
        changeFoo: () => ({ type: 'CHANGE_FOO' }),
      },
    });
    const instance = renderer.create(<ConnectedComponent store={mockStore()} />);

    expect(instance.root.children[0].props).toHaveProperty('test.changeFoo', expect.any(Function));
  });

  it('should should inject a state object into the props using a valid stateKey', () => {
    Connector.use({
      update: () => null,
      addReducer: () => null,
    });

    const ConnectedComponent = Connector.connect(getMockComponent(), {
      name: 'test',
      stateKey: 'test',
      reducer: (state = {}) => state,
    });
    const instance = renderer.create(<ConnectedComponent store={mockStore({ test: {} })} />);

    expect(instance.root.children[0].props).toHaveProperty('test', expect.any(Object));
  });

  it('should map the state to the state object that is injected into the props', () => {
    Connector.use({
      update: () => null,
      addReducer: () => null,
    });

    const ConnectedComponent = Connector.connect(getMockComponent(), {
      name: 'test',
      stateKey: 'test',
      reducer: (state = {}) => state,
    });
    const instance = renderer.create(<ConnectedComponent store={mockStore({ test: { foo: 'baz' } })} />);

    expect(instance.root.children[0].props).toHaveProperty('test.foo', 'baz');
  });

  it('should try to create a stateKey if it is set to auto', () => {
    Connector.use({
      update: () => null,
      addReducer: () => null,
    });

    const test = () => <div />;

    const ConnectedComponent = Connector.connect(test, {
      name: 'test',
      stateKey: 'auto',
    });
    const instance = renderer.create(<ConnectedComponent store={mockStore({ test: {} })} />);

    expect(instance.root.children[0].props).toHaveProperty('test', expect.any(Object));
  });

  it('should use an `actions` property object if the state and actions keys are equal', () => {
    Connector.use({
      update: () => null,
      addReducer: () => null,
    });

    const ConnectedComponent = Connector.connect(getMockComponent(), {
      name: 'test',
      stateKey: 'test',
      actionsKey: 'test',
      actionCreators: {
        baz: () => null,
      },
    });
    const instance = renderer.create(<ConnectedComponent
      store={mockStore()}
    />);

    expect(instance.root.children[0].props).toHaveProperty('actions.test.baz', expect.any(Function));
  });
});
