import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import {
  Provider,
  connect,
} from '../src';
import store from '../src/store';
import { ERRORS } from '../src/connect';

describe('Tests', () => {
  afterEach(() => {
    cleanup();
    store.reset();
  });

/* SYNC */

  it('should connect a component to the store', () => {
    const TestComponent = connect(
      ({ state }) => (
        <div>{state.message}</div>
      ),
      {
        name: 'test',
        state: { message: 'foo' },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('foo')).toBeInTheDocument();
  });

  it('should update the state by dispatching an action', () => {
    const TestComponent = connect(
      ({ state, actions }) => (
        <div>
          <h1>{state.message}</h1>
          <button onClick={actions.update}>Click</button>
        </div>
      ),
      {
        name: 'test',
        state: { message: 'foo' },
        actions: { update: () => ({ message: 'baz' }) },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('foo')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('baz')).toBeInTheDocument();
  });

  it('should update a state field by listening to an action', () => {
    const FooComponent = connect(
      ({ actions }) => (<button onClick={() => actions.update('foo')}>Click</button>),
      {
        name: 'foo',
        actions: { update: (message) => ({ message }) },
      },
    );
    const BazComponent = connect(
      ({ state }) => (<div>{state.message}</div>),
      {
        name: 'baz',
        state: { message: 'baz' },
        handlers: { 'foo.update': ({ args: [message] }) => ({ message }) },
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByText('baz')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('foo')).toBeInTheDocument();
  });

  it('should update a state field that depends on the current state', () => {
    const TestComponent = connect(
      ({ state, actions }) => (
        <div>
          <h1>{state.count}</h1>
          <button onClick={() => {
            actions.increment();
            actions.increment();
          }}>Click</button>
        </div>
      ),
      {
        name: 'test',
        state: { count: 0 },
        actions: { increment: () => currentState => ({ count: currentState.count + 1 }) },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should update a nested state field by dispatching an action', () => {
    const TestComponent = connect(
      ({ state, actions }) => (
        <>
          <div>{state.foo.baz.message}</div>
          <button onClick={actions.update}>
            Click
          </button>
        </>
      ),
      {
        name: 'test',
        state: {
          foo: {
            baz: {
              message: 'peeka',
            },
          },
        },
        actions: {
          update: () => ({
            'foo.baz.message': 'boo',
          }),
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('peeka')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('boo')).toBeInTheDocument();
  });

  it('should update a nested state field by listening to an action', () => {
    const FooComponent = connect(
      ({ actions }) => (<button onClick={() => actions.update('boo')}>Click</button>),
      {
        name: 'foo',
        actions: { update: (message) => ({ message }) },
      },
    );
    const BazComponent = connect(
      ({ state }) => (<div>{state.foo.baz.message}</div>),
      {
        name: 'baz',
        state: {
          foo: {
            baz: {
              message: 'peeka',
            },
          },
        },
        handlers: { 'foo.update': ({ args: [message] }) => ({ 'foo.baz.message': message }) },
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByText('peeka')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('boo')).toBeInTheDocument();
  });

  /* ASYNC */

  it('should update the state by dispatching an asyncronous action', async () => {
    const fetchData = () => new Promise(resolve => setTimeout(resolve, 1000, 'Peekaboo'));
    const TestComponent = connect(
      ({ state, actions }) => (
        <>
          <div data-testid="status">{state.status}</div>
          <div data-testid="content">{state.content}</div>
          <button onClick={actions.loadData}>
            Click
          </button>
        </>
      ),
      {
        name: 'test',
        state: {
          status: null,
          content: 'No data',
        },
        actions: {
          * loadData() {
            yield { status: 'Loading...' };
            const content = yield fetchData();
            yield {
              status: 'Ready',
              content,
            };
          },
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByTestId('status')).toBeEmptyDOMElement();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('status')).toHaveTextContent('Loading...');
    await screen.findByText('Ready');
    expect(screen.getByTestId('content')).toHaveTextContent('Peekaboo');
  });

  it('should update the state by listening to an asyncronous action', async () => {
    const fetchData = () => new Promise(resolve => setTimeout(resolve, 1000, 'Peekaboo'));
    const FooComponent = connect(
      ({ actions }) => <button onClick={actions.loadData}>Click</button>,
      {
        name: 'foo',
        actions: {
          * loadData() {
            const content = yield fetchData();
            yield {
              status: 'Ready',
              content,
            };
          },
        },
      },
    );
    const BazComponent = connect(
      ({ state }) => (
        <>
          <div data-testid="status">{state.status.join('.')}</div>
          <div data-testid="content">{state.content}</div>
        </>
      ),
      {
        name: 'baz',
        state: {
          status: [],
          content: null,
        },
        handlers: {
          'foo.loadData': () => currentState => ({
            status: [...currentState.status, 'started'],
          }),
          'foo.loadData.update': (action) => currentState => ({
            status: [...currentState.status, 'updating'],
            content: action.payload.content,
          }),
          'foo.loadData.complete': () => currentState => ({
            status: [...currentState.status, 'complete'],
          }),
        },
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('status')).toBeEmptyDOMElement();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('status')).toHaveTextContent('started');
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('started.updating');
    });
    await screen.findByText('started.updating.complete');
    expect(screen.getByTestId('content')).toHaveTextContent('Peekaboo');
  });

  it('should update the state using an asyncronous handler', async () => {
    const fetchData = user => new Promise(resolve => setTimeout(resolve, 1000, `Data for ${user}`));
    const FooComponent = connect(
      ({ actions }) => <button onClick={() => actions.changeUser('FooBaz')}>Click</button>,
      {
        name: 'foo',
        actions: {
          changeUser: (user) => ({ user }),
        },
      },
    );
    const BazComponent = connect(
      ({ state }) => (
        <>
          <div data-testid="status">{state.status}</div>
          <div data-testid="content">{state.content}</div>
        </>
      ),
      {
        name: 'baz',
        state: {
          status: [],
          content: null,
        },
        handlers: {
          *['foo.changeUser']({ args: [user] }) {
            yield { status: 'Loading...' };
            const data = yield fetchData(user);
            yield {
              status: 'Ready',
              content: data,
            };
          }
        },
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('status')).toBeEmptyDOMElement();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('status')).toHaveTextContent('Loading...');
    await screen.findByText('Ready');
    expect(screen.getByTestId('content')).toHaveTextContent('Data for FooBaz');
  });

  it('should update a nested state field that depends on the current state by dispatching an asyncronous action', async () => {
    const TestComponent = connect(
      ({ state, actions }) => (
        <div>
          <h1>{state.data.count}</h1>
          <button onClick={() => {
            actions.increment();
            actions.increment();
          }}>Click</button>
        </div>
      ),
      {
        name: 'test',
        state: {
          data: {
            count: 0,
          },
        },
        actions: {
          * increment() {
            yield currentState => ({ 'data.count': currentState.data.count + 1 });
          },
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should be able to return multiple promises', async () => {
    const fetchDataA = () => new Promise(resolve => setTimeout(resolve, 500, 10));
    const fetchDataB = () => new Promise(resolve => setTimeout(resolve, 300, 20));
    const fetchDataC = () => new Promise(resolve => setTimeout(resolve, 100, 30));
    const TestComponent = connect(
      ({ state, actions }) => (
        <>
          <h1>{state.count}</h1>
          <button onClick={actions.loadData}>Click</button>
        </>
      ),
      {
        name: 'test',
        state: {
          count: 0,
        },
        actions: {
          * loadData() {
            const [numA, numB, numC] = yield [fetchDataA(), fetchDataB(), fetchDataC()];
            yield {
              count: numA + numB + numC,
            };
          },
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    await screen.findByText('60');
  });

  it('should handle errors in an asyncronous action', async () => {
    const faultyFetchData = () => Promise.reject(new Error());
    const TestComponent = connect(
      ({ state, actions }) => (
        <>
          <div data-testid="status">{state.status}</div>
          <button onClick={actions.loadData}>
            Click
          </button>
        </>
      ),
      {
        name: 'test',
        state: {
          status: null,
          content: null,
        },
        actions: {
          * loadData() {
            yield { status: 'Loading...' };
            const response = yield faultyFetchData();

            if (response instanceof Error) {
              yield {
                status: 'Failed',
              };

              return;
            }

            yield {
              status: 'Ready',
              content: response.data,
            };
          },
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByTestId('status')).toBeEmptyDOMElement();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('status')).toHaveTextContent('Loading...');
    await screen.findByText('Failed');
  });

  it('should handle errors in an asyncronous action by returning a value', async () => {
    const faultyFetchData = () => Promise.reject(new Error());
    const TestComponent = connect(
      ({ state, actions }) => (
        <>
          <div data-testid="status">{state.status}</div>
          <div data-testid="content">{state.content}</div>
          <button onClick={actions.loadData}>
            Click
          </button>
        </>
      ),
      {
        name: 'test',
        state: {
          status: null,
          content: null,
        },
        actions: {
          * loadData() {
            yield { status: 'Loading...' };
            const response = yield faultyFetchData().catch(e => {
              return {
                data: 'Failed'
              }
            });

            yield {
              status: 'Ready',
              content: response.data,
            };
          },
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByTestId('status')).toBeEmptyDOMElement();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('status')).toHaveTextContent('Loading...');
    await screen.findByText('Ready');
    expect(screen.getByTestId('content')).toHaveTextContent('Failed');
  });

  /* DISPATCH */

  it('should dispatch a syncronous action from another component', () => {
    const FooComponent = connect(
      ({ state }) => <div data-testid="content">{state.content}</div>,
      {
        name: 'foo',
        actions: {
          setContent: (content) => ({ content }),
        },
      },
    );
    const BazComponent = connect(
      ({ dispatch }) => <button onClick={() => dispatch('foo.setContent', 'foobaz')}>Click</button>,
      {
        name: 'baz',
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toBeEmptyDOMElement();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('content')).toHaveTextContent('foobaz');
  });

  it('should dispatch an asyncronous action from another component', async () => {
    const fetchData = (message) => new Promise(resolve => setTimeout(resolve, 1000, message));
    const FooComponent = connect(
      ({ state }) => (
        <>
          <div data-testid="status">{state.status}</div>
          <div data-testid="content">{state.content}</div>
        </>
      ),
      {
        name: 'foo',
        state: {
          status: null,
          content: 'No data',
        },
        actions: {
          * loadData(message) {
            yield { status: 'Loading...' };
            const content = yield fetchData(message);
            yield {
              status: 'Ready',
              content,
            };
          },
        },
      },
    );
    const BazComponent = connect(
      ({ dispatch }) => <button onClick={() => dispatch('foo.loadData', 'FooBaz')}>Click</button>,
      {
        name: 'baz',
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('status')).toBeEmptyDOMElement();
    expect(screen.getByTestId('content')).toHaveTextContent('No data');
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('status')).toHaveTextContent('Loading...');
    await screen.findByText('Ready');
    expect(screen.getByTestId('content')).toHaveTextContent('FooBaz');
  });

  it('should dispatch and listen to foreign actions', () => {
    const FooComponent = connect(
      ({ state }) => (
        <div data-testid="content">{state.content}</div>
      ),
      {
        name: 'foo',
        state: {
          content: null,
        },
        handlers: {
          'customAction': ({ payload }) => ({
            content: payload
          })
        },
      },
    );
    const BazComponent = connect(
      ({ dispatch }) => (
        <button onClick={() => dispatch({ type: 'customAction', payload: 'foobaz' })}>
          Click
        </button>
      ),
      {
        name: 'baz',
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toBeEmptyDOMElement();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('content')).toHaveTextContent('foobaz');
  });

  /* GLOBAL STATE */

  it('should be able to query the global state', () => {
    const FooComponent = connect(
      ({ globalState }) => (
        <div data-testid="content">{globalState.title}</div>
      ),
      {
        name: 'foo',
        globalState: {
          title: 'baz.items[0].title',
        },
      },
    );
    const BazComponent = connect(
      () => null,
      {
        name: 'baz',
        state: {
          items: [
            { title: 'bizbaz' },
          ],
        },
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('bizbaz');
  });

  /* CUSTOM KEYS */

  it('should be able to use a different name for the injected state', () => {
    const TestComponent = connect(
      ({ data }) => (
        <div data-testid="content">{data.message}</div>
      ),
      {
        name: 'foo',
        stateKey: 'data',
        state: {
          message: 'Foo',
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Foo');
  });

  it('should be able to use a different name for the injected actions', () => {
    const TestComponent = connect(
      ({ state, userActions }) => (
        <>
          <div data-testid="content">{state.message}</div>
          <button onClick={userActions.changeMessage}>
            Click
          </button>
        </>
      ),
      {
        name: 'foo',
        state: {
          message: 'Foo',
        },
        actionsKey: 'userActions',
        actions: {
          changeMessage: () => ({ message: 'Baz' })
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Foo');
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('content')).toHaveTextContent('Baz');
  });

  it('should be able to use a different name for the injected dispatch', () => {
    const TestComponent = connect(
      ({ state, trigger }) => (
        <>
          <div data-testid="content">{state.message}</div>
          <button onClick={() => trigger({ type: 'changeTheMessage', payload: 'FizBaz' })}>
            Click
          </button>
        </>
      ),
      {
        name: 'foo',
        state: {
          message: 'Foo',
        },
        dispatchKey: 'trigger',
        handlers: {
          changeTheMessage: ({ payload }) => ({ message: payload }),
        },
      },
    );
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Foo');
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByTestId('content')).toHaveTextContent('FizBaz');
  });

  it('should be able to use a different name for the injected global state', () => {
    const FooComponent = connect(
      ({ bazState }) => (
        <div data-testid="content">{bazState.title}</div>
      ),
      {
        name: 'foo',
        globalStateKey: 'bazState',
        globalState: {
          title: 'baz.items[0].title',
        },
      },
    );
    const BazComponent = connect(
      () => null,
      {
        name: 'baz',
        state: {
          items: [
            { title: 'bizbaz' },
          ],
        },
      },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('bizbaz');
  });

  /* ERRORS AND WARNINGS */

  it('should warn if two components connect using the same name', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    const FooComponent = connect(
      () => null,
      { name: 'foo' },
    );
    const BazComponent = connect(
      () => null,
      { name: 'foo' },
    );
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/Duplicate name: foo/));
    spy.mockRestore();
  });

  it('should throw if no component or no configuration is passed', () => {
    expect(() => connect()).toThrow(ERRORS.MISSING_ARGS);
    expect(() => connect(() => null)).toThrow(ERRORS.MISSING_ARGS);
    expect(() => connect({ name: 'foo' })).toThrow(ERRORS.MISSING_ARGS);
  });

  it('should throw if an invalid component is passed', () => {
    expect(() => connect({}, { name: 'foo' })).toThrow(ERRORS.INVALID_COMPONENT);
  });

  it('should throw if the configuration object is invalid', () => {
    expect(() => connect(() => null, 'invalid config')).toThrow(ERRORS.INVALID_CONFIG);
  });

  it('should throw if the name is missing', () => {
    expect(() => connect(() => null, {})).toThrow(ERRORS.MISSING_NAME);
  });
});
