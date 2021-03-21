import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import Provider from '../src/provider';
import store from '../src/store';
import createGlobalState from '../src/create';
import useGlobalState from '../src/use-global-state';
import useDispatch from '../src/use-dispatch';

describe('use-dispatch', () => {
  beforeEach(() => {
    store.create();
  });

  afterEach(() => {
    store.reset();
  });

  it('should dispatch an general action', () => {
    const listener = jest.fn();
    store.subscribe('FOO_ACTION', listener);
    const Foo = () => {
      const dispatch = useDispatch();
      return (
        <div>
          <button onClick={() => dispatch({ type: 'FOO_ACTION' })}>
            Click
          </button>
        </div>
      );
    };
    render(<Provider><Foo /></Provider>);
    userEvent.click(screen.getByText('Click'));
    expect(listener).toHaveBeenCalledWith({ type: 'FOO_ACTION' });
  });

  it('should dispatch an action', () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      actions: { changeMessage: (message) => ({ message }) },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.message}</div>
          <button onClick={() => dispatch({ type: '@@foo/CHANGE_MESSAGE', args: ['world'] })}>
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

  it('should dispatch an action using dot notation', () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      actions: { changeMessage: (message) => ({ message }) },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.message}</div>
          <button onClick={() => dispatch('foo.changeMessage', 'world')}>
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

  it('should dispatch an action using a specific name', () => {
    createGlobalState({
      name: 'foo',
      state: { message: 'hello' },
      actions: { changeMessage: (message) => ({ message }) },
    });
    const Foo = () => {
      const state = useGlobalState('foo');
      const dispatch = useDispatch('foo');
      return (
        <div>
          <div>{state.message}</div>
          <button onClick={() => dispatch('changeMessage', 'world')}>
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
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => dispatch('@@foo/INCREASE_COUNT')}>
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

  it('should dispatch an async action using dot notation', async () => {
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
      const dispatch = useDispatch();
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => dispatch('foo.increaseCount')}>
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

  it('should dispatch an async action using a specific name', async () => {
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
      const dispatch = useDispatch('foo');
      return (
        <div>
          <div>{state.count}</div>
          <button onClick={() => dispatch('increaseCount')}>
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
});
