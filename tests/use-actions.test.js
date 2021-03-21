import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import Provider from '../src/provider';
import store from '../src/store';
import createGlobalState from '../src/create';
import useGlobalState from '../src/use-global-state';
import useActions from '../src/use-actions';
import useDispatch from '../src/use-dispatch';

describe('use-actions', () => {
  beforeEach(() => {
    store.create();
  });

  afterEach(() => {
    store.reset();
  });

  it('should dispatch an action', () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      actions: { changeMessage: (message) => ({ message }) },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.message}</div>
          <button onClick={() => actions.changeMessage('world')}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('should update state using dot notation', () => {
    createGlobalState({
      name: 'foo',
      state: { root: { data: [{ message: 'hello' }] } },
      actions: {
        changeMessage: (message) => ({
          'root.data[0].message': message,
        }),
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.root.data[0].message}</div>
          <button onClick={() => actions.changeMessage('world')}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('should update state using previous state', () => {
    createGlobalState({
      name: 'foo',
      state: { count: 0 },
      actions: {
        increaseCount: () => (prevState) => ({
          count: prevState.count + 1,
        }),
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => actions.increaseCount()}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('0')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should handle an action', () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      handlers: {
        'FOO_ACTION': (action) => ({ message: action.message }),
      }
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.message}</div>
          <button onClick={() => dispatch({ type: 'FOO_ACTION', message: 'world' })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('should handle an action using dot notation', () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      actions: { changeMessage: (message) => ({ message }) },
    });
    createGlobalState({
      name: 'baz',
      state: { status: 'original' },
      handlers: {
        'foo.changeMessage': (action) => ({ status: `changed to \`${action.args[0]}\`` }),
      }
    });
    const Foo = () => {
      const state = useGlobalState('baz');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.status}</div>
          <button onClick={() => actions.changeMessage('world')}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('original')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('changed to `world`')).toBeInTheDocument();
  });

  it('should update state using dot notation from a handler', () => {
    createGlobalState({
      name: 'foo',
      state: { root: { data: [{ message: 'hello' }] } },
      handlers: {
        'FOO_ACTION': (action) => ({
          'root.data[0].message': action.message,
        }),
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.root.data[0].message}</div>
          <button onClick={() => dispatch({ type: 'FOO_ACTION', message: 'world' })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('should update state using previous state from a handler', () => {
    createGlobalState({
      name: 'foo',
      state: { count: 0 },
      handlers: {
        'INCREASE_COUNT_BY': (action) => (prevState) => ({
          count: prevState.count + action.value,
        }),
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => dispatch({ type: 'INCREASE_COUNT_BY', value: 10 })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('0')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  // ASYNC

  it('should dispatch an async action', async () => {
    createGlobalState({
      name: 'foo',
      state: { count: 1 },
      actions: {
        * increaseCount() {
          yield { count: 2 };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => actions.increaseCount()}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('1')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  it('should resolve a promise from an async action', async () => {
    createGlobalState({
      name: 'foo',
      state: { count: 1 },
      actions: {
        * increaseCount() {
          const count = yield Promise.resolve(2);
          yield { count };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => actions.increaseCount()}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('1')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  it('should update state using dot notation from an async action', async () => {
    createGlobalState({
      name: 'foo',
      state: { counter: { data: [{ count: 1 }] } },
      actions: {
        * setCount(count) {
          yield { 'counter.data[0].count': count };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.counter.data[0].count}</div>
          <button onClick={() => actions.setCount(100)}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('1')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('100')).toBeInTheDocument();
  });

  it('should update state using previous state from an async action', async () => {
    createGlobalState({
      name: 'foo',
      state: { count: 1 },
      actions: {
        * increaseCount() {
          yield (prevState) => ({ count: prevState.count + 1 });
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => actions.increaseCount()}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('1')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  it('should handle errors in an async action', async () => {
    createGlobalState({
      name: 'foo',
      state: { data: 1, error: false },
      actions: {
        * fetchData() {
          const response = yield Promise.reject(new Error('whoops'));
          yield { error: response instanceof Error };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.error ? 'has error' : ''}</div>
          <button onClick={() => actions.fetchData()}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.queryByText('has error')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('has error')).toBeInTheDocument();
  });

  it('should handle errors in an async action by returning a value', async () => {
    const faultyFetchData = () => Promise.reject(new Error());
    createGlobalState({
      name: 'foo',
      state: { data: 'no data', error: false },
      actions: {
        * fetchData() {
          const response = yield faultyFetchData().catch(() => {
            return {
              data: 'request failed',
            };
          });
          yield { data: response.data };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.data}</div>
          <button onClick={() => actions.fetchData()}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('no data')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('request failed')).toBeInTheDocument();
  });

  it('should handle an action, asyncronously', async () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      handlers: {
        * FOO_ACTION(action) {
          yield { message: action.message };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.message}</div>
          <button onClick={() => dispatch({ type: 'FOO_ACTION', message: 'world' })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('world')).toBeInTheDocument();
  });

  it('should resolve a promise from an async handler', async () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      handlers: {
        * FOO_ACTION(action) {
          const message = yield Promise.resolve(action.message);
          yield { message };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.message}</div>
          <button onClick={() => dispatch({ type: 'FOO_ACTION', message: 'world' })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('world')).toBeInTheDocument();
  });

  it('should handle an action using dot notation, asyncronously', async () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      actions: { changeMessage: (message) => ({ message }) },
    });
    createGlobalState({
      name: 'baz',
      state: { status: 'original' },
      handlers: {
        * 'foo.changeMessage'(action) {
          yield { status: `changed to \`${action.args[0]}\`` };
        },
      }
    });
    const Foo = () => {
      const state = useGlobalState('baz');
      const actions = useActions('foo');
      return (
        <div>
          <div>{state.status}</div>
          <button onClick={() => actions.changeMessage('world')}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('original')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('changed to `world`')).toBeInTheDocument();
  });

  it('should update state using dot notation from a handler, asyncronously', async () => {
    createGlobalState({
      name: 'foo',
      state: { root: { data: [{ message: 'hello' }] } },
      handlers: {
        * 'FOO_ACTION'(action) {
          yield { 'root.data[0].message': action.message };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.root.data[0].message}</div>
          <button onClick={() => dispatch({ type: 'FOO_ACTION', message: 'world' })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('world')).toBeInTheDocument();
  });

  it('should update state using previous state from a handler, asyncronously', async () => {
    createGlobalState({
      name: 'foo',
      state: { count: 0 },
      handlers: {
        * 'INCREASE_COUNT_BY'(action) {
          yield (prevState) => ({
            count: prevState.count + action.value,
          });
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => dispatch({ type: 'INCREASE_COUNT_BY', value: 10 })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('0')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('10')).toBeInTheDocument();
  });

  it('should handle errors in an async handler', async () => {
    createGlobalState({
      name: 'foo',
      state: { data: 1, error: false },
      handlers: {
        * fetchData() {
          const response = yield Promise.reject(new Error('whoops'));
          yield { error: response instanceof Error };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.error ? 'has error' : ''}</div>
          <button onClick={() => dispatch({ type: 'fetchData' })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.queryByText('has error')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('has error')).toBeInTheDocument();
  });
  it('should handle errors in an async handler by returning a value', async () => {
    const faultyFetchData = () => Promise.reject(new Error());
    createGlobalState({
      name: 'foo',
      state: { data: 'no data', error: false },
      handlers: {
        * 'baz.fetchData'() {
          const response = yield faultyFetchData().catch(() => {
            return {
              data: 'request failed',
            };
          });
          yield { data: response.data };
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.data}</div>
          <button onClick={() => dispatch({ type: 'baz.fetchData' })}>
            Click
          </button>
        </div>
      );
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('no data')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('request failed')).toBeInTheDocument();
  });
});
