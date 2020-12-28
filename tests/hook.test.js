import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import {
  Provider,
  createHooks,
  getStore,
} from '../src';
import store from '../src/store';
import { ERRORS } from '../src/hook';

describe('Tests', () => {
  afterEach(() => {
    cleanup();
    store.reset();
  });

  it('should return react hooks', () => {
    const hooks = createHooks('test');
    expect(hooks).toMatchObject({
      useState: expect.any(Function),
      useActions: expect.any(Function),
      useHandlers: expect.any(Function),
      useDispatch: expect.any(Function),
      useGlobalState: expect.any(Function),
    });
  });

  /* SYNC */

  it('should be able to call `useState` without arguments', () => {
    const { useState } = createHooks({
      name: 'test',
      state: {
        message: 'foo',
      },
    });
    const TestComponent = () => {
      const state = useState();
      return (
        <div>
          <h1>{state.message}</h1>
        </div>
      );
    };
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('foo')).toBeInTheDocument();
  });

  it('should be able to call `useAction` without arguments', () => {
    const { useState, useActions } = createHooks({
      name: 'test',
      state: {
        message: 'foo',
      },
      actions: {
        update: (message) => ({ message }),
      },
    });
    const TestComponent = () => {
      const state = useState();
      const actions = useActions();
      return (
        <div>
          <h1>{state.message}</h1>
          <button onClick={() => actions.update('baz')}>Click</button>
        </div>
      );
    };
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('foo')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('baz')).toBeInTheDocument();
  });

  it('should be able to set handlers with calling `useHandlers`', () => {
    const FooComponent = (() => {
      const { useActions } = createHooks('foo');

      return () => {
        const actions = useActions({ update: (message) => ({ message }) });
        return (
          <button onClick={() => actions.update('foo')}>
            Click
          </button>
        );
      };
    })();

    const BazComponent = (() => {
      const { useState } = createHooks({
        name: 'baz',
        handlers: {
          'foo.update': ({ args: [message] }) => ({ message }),
        },
      });

      return () => {
        const state = useState({ message: 'baz' });
        return (
          <div>{state.message}</div>
        );
      };
    })();
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

  it('should be able to call `useGlobalState` without arguments', async () => {
    const FooComponent = (() => {
      const { useGlobalState } = createHooks({
        name: 'foo',
        globalState: {
          title: 'baz.items[0].title',
        },
      });

      return () => {
        const globalState = useGlobalState();
        return (
          <div data-testid="content">{globalState?.title}</div>
        );
      }
    })();
    const BazComponent = (() => {
      const { useState } = createHooks('baz');

      return () => {
        useState({
          items: [
            { title: 'bizbaz' },
          ],
        });
        return null;
      }
    })();
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toBeEmptyDOMElement();
    await screen.findByText('bizbaz');
  });

  it('should connect a component to the store', () => {
    const { useState } = createHooks('test');
    const TestComponent = () => {
      const state = useState({ message: 'foo' });
      return (
        <div>{state.message}</div>
      );
    };
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByText('foo')).toBeInTheDocument();
  });

  it('should be able to set the state in the store without calling `useState`', () => {
    createHooks({
      name: 'test',
      state: {
        message: 'foo',
      },
    });
    render(
      <Provider />
    );
    expect(getStore().getState()).toMatchObject({ test: { message: 'foo' } });
  });

  it('should update the state by dispatching an action', () => {
    const { useState, useActions } = createHooks('test');
    const TestComponent = () => {
      const state = useState({ message: 'foo' });
      const actions = useActions({ update: () => ({ message: 'baz' }) });
      return (
        <div>
          <h1>{state.message}</h1>
          <button onClick={actions.update}>Click</button>
        </div>
      );
    };
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
    const FooComponent = (() => {
      const { useActions } = createHooks('foo');

      return () => {
        const actions = useActions({ update: (message) => ({ message }) });
        return (
          <button onClick={() => actions.update('foo')}>
            Click
          </button>
        );
      };
    })();

    const BazComponent = (() => {
      const { useState, useHandlers } = createHooks('baz');

      return () => {
        const state = useState({ message: 'baz' });
        useHandlers({
          'foo.update': ({ args: [message] }) => ({ message }),
        });
        return (
          <div>{state.message}</div>
        );
      };
    })();
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
    const { useState, useActions } = createHooks('test');
    
    const TestComponent = () => {
      const state = useState({ count: 0 });
      const actions = useActions({ increment: () => currentState => ({ count: currentState.count + 1 }) });
      return (
        <div>
          <h1>{state.count}</h1>
          <button onClick={() => {
            actions.increment();
            actions.increment();
          }}>Click</button>
        </div>
      );
    }
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
    const { useState, useActions } = createHooks('test');

    const TestComponent = () => {
      const state = useState({
        foo: {
          baz: {
            message: 'peeka',
          },
        },
      });
      const actions = useActions({
        update: () => ({
          'foo.baz.message': 'boo',
        }),
      });
      return (
        <>
          <div>{state.foo.baz.message}</div>
          <button onClick={actions.update}>
            Click
          </button>
        </>
      );
    }
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
    const FooComponent = (() => {
      const { useActions } = createHooks('foo');
      return () => {
        const actions = useActions({ update: (message) => ({ message }) });
        return (
          <button onClick={() => actions.update('boo')}>
            Click
          </button>
        )
      };
    })();

    const BazComponent = (() => {
      const { useState, useHandlers } = createHooks('baz');
      return () => {
        const state = useState({
          foo: {
            baz: {
              message: 'peeka',
            },
          },
        });
        useHandlers({ 'foo.update': ({ args: [message] }) => ({ 'foo.baz.message': message }) });
        return (
          <div>{state.foo.baz.message}</div>
        )
      };
    })();
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
    const { useState, useActions } = createHooks('test');
    const TestComponent = () => {
      const state = useState({
        status: null,
        content: 'No data',
      });
      const actions = useActions({
        * loadData() {
          yield { status: 'Loading...' };
          const content = yield fetchData();
          yield {
            status: 'Ready',
            content,
          };
        },
      });
      return (
        <>
          <div data-testid="status">{state.status}</div>
          <div data-testid="content">{state.content}</div>
          <button onClick={actions.loadData}>
            Click
          </button>
        </>
      );
    };
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
    const FooComponent = (() => {
      const { useActions } = createHooks('foo');
      return () => {
        const actions = useActions({
          * loadData() {
            const content = yield fetchData();
            yield {
              status: 'Ready',
              content,
            };
          },
        });
        return (
          <button onClick={actions.loadData}>Click</button>
        );
      };
    })();
    const BazComponent = (() => {
      const { useState, useHandlers } = createHooks('baz');
      return () => {
        const state = useState({
          status: [],
          content: null,
        });
        useHandlers({
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
        });
        return (
          <>
            <div data-testid="status">{state.status.join('.')}</div>
            <div data-testid="content">{state.content}</div>
          </>
        );
      };
    })();
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
    const FooComponent = (() => {
      const { useActions } = createHooks('foo');

      return () => {
        const actions = useActions({
          changeUser: (user) => ({ user })
        });
        return (
          <button onClick={() => actions.changeUser('FooBaz')}>Click</button>
        );
      }
    })();
    const BazComponent = (() => {
      const { useState, useHandlers } = createHooks('baz');

      return () => {
        const state = useState({
          status: [],
          content: null,
        });
        useHandlers({
          *['foo.changeUser']({ args: [user] }) {
            yield { status: 'Loading...' };
            const data = yield fetchData(user);
            yield {
              status: 'Ready',
              content: data,
            };
          }
        });
        return (
          <>
            <div data-testid="status">{state.status}</div>
            <div data-testid="content">{state.content}</div>
          </>
        );
      };
    })();
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
    const TestComponent = (() => {
      const { useState, useActions } = createHooks('test');

      return () => {
        const state = useState({
          data: {
            count: 0,
          },
        });
        const actions = useActions({
          * increment() {
            yield currentState => ({ 'data.count': currentState.data.count + 1 });
          },
        });
        return (
          <div>
            <h1>{state.data.count}</h1>
            <button onClick={() => {
              actions.increment();
              actions.increment();
            }}>Click</button>
          </div>
        );
      }
    })();
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
    const TestComponent = (() => {
      const { useState, useActions } = createHooks('test');
      return () => {
        const state = useState({
          count: 0,
        });
        const actions = useActions({
          * loadData() {
            const [numA, numB, numC] = yield [fetchDataA(), fetchDataB(), fetchDataC()];
            yield {
              count: numA + numB + numC,
            };
          },
        });
        return (
          <>
            <h1>{state.count}</h1>
            <button onClick={actions.loadData}>Click</button>
          </>
        );
      };
    })();
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
    const TestComponent = (() => {
      const { useState, useActions } = createHooks('test');

      return () => {
        const state = useState({
          status: null,
          content: null,
        });
        const actions = useActions({
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
        });
        return (
          <>
            <div data-testid="status">{state.status}</div>
            <button onClick={actions.loadData}>
              Click
          </button>
          </>
        );
      }
    })();
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
    const TestComponent = (() => {
      const { useState, useActions } = createHooks('test');

      return () => {
        const state = useState({
          status: null,
          content: null,
        });
        const actions = useActions({
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
        });
        return (
          <>
            <div data-testid="status">{state.status}</div>
            <div data-testid="content">{state.content}</div>
            <button onClick={actions.loadData}>
              Click
            </button>
          </>
        );
      }
    })();
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
    const FooComponent = (() => {
      const { useState, useActions } = createHooks('foo');

      return () => {
        const state = useState();
        useActions({
          setContent: (content) => ({ content }),
        });
        return (
          <div data-testid="content">{state.content}</div>
        );
      }
    })();
    const BazComponent = (() => {
      const { useDispatch } = createHooks('baz');

      return () => {
        const dispatch = useDispatch();
        return (
          <button onClick={() => dispatch('foo.setContent', 'foobaz')}>Click</button>
        );
      }
    })();
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
    const FooComponent = (() => {
      const { useState, useActions } = createHooks('foo');

      return () => {
        const state = useState({
          status: null,
          content: 'No data',
        });
        const actions = useActions({
          * loadData(message) {
            yield { status: 'Loading...' };
            const content = yield fetchData(message);
            yield {
              status: 'Ready',
              content,
            };
          },
        });
        return (
          <>
            <div data-testid="status">{state.status}</div>
            <div data-testid="content">{state.content}</div>
          </>
        );
      }
    })();
    const BazComponent = (() => {
      const { useDispatch } = createHooks('baz');

      return () => {
        const dispatch = useDispatch();
        return (
          <button onClick={() => dispatch('foo.loadData', 'FooBaz')}>Click</button>
        );
      }
    })();
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
    const FooComponent = (() => {
      const { useState, useHandlers } = createHooks('foo');

      return () => {
        const state = useState({
          content: null,
        });
        useHandlers({
          'customAction': ({ payload }) => ({
            content: payload
          })
        });
        return (
          <div data-testid="content">{state.content}</div>
        );
      }
    })();
    const BazComponent = (() => {
      const { useDispatch } = createHooks('baz');

      return () => {
        const dispatch = useDispatch();
        return (
          <button onClick={() => dispatch({ type: 'customAction', payload: 'foobaz' })}>
            Click
          </button>
        );
      }
    })();
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

  it('should be able to query the global state', async () => {
    const FooComponent = (() => {
      const { useGlobalState } = createHooks('foo');

      return () => {
        const globalState = useGlobalState({
          title: 'baz.items[0].title',
        });
        return (
          <div data-testid="content">{globalState?.title}</div>
        );
      }
    })();
    const BazComponent = (() => {
      const { useState } = createHooks('baz');

      return () => {
        useState({
          items: [
            { title: 'bizbaz' },
          ],
        });
        return null;
      }
    })();
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(screen.getByTestId('content')).toBeEmptyDOMElement();
    await screen.findByText('bizbaz');
  });

  /* ERRORS AND WARNINGS */

  it('should warn if two components connect using the same name', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    const FooComponent = (() => {
      createHooks('foo');
      return () => null;
    })();
    const BazComponent = (() => {
      createHooks('foo');
      return () => null;
    })();
    render(
      <Provider>
        <FooComponent />
        <BazComponent />
      </Provider>
    );
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/Duplicate name: foo/));
    spy.mockRestore();
  });

    it('should throw if the configuration object is invalid', () => {
    expect(() => {
      createHooks(true);
    }).toThrow(ERRORS.INVALID_CONFIG);

    expect(() => {
      createHooks(10);
    }).toThrow(ERRORS.INVALID_CONFIG);
  });

  it('should throw if the name is missing', () => {
    expect(() => {
      createHooks();
    }).toThrow(ERRORS.MISSING_NAME);

    expect(() => {
      createHooks({});
    }).toThrow(ERRORS.MISSING_NAME);
  });

  it('should throw if the name is invalid', () => {
    expect(() => {
      createHooks({ name: 10 });
    }).toThrow(ERRORS.INVALID_NAME);

    expect(() => {
      createHooks({ name: true });
    }).toThrow(ERRORS.INVALID_NAME);
  });
});
