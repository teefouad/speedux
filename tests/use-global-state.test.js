import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import Provider from '../src/provider';
import store from '../src/store';
import createGlobalState from '../src/create';
import useGlobalState from '../src/use-global-state.js';
import useActions from '../src/use-actions.js';

describe('use-global-state', () => {
  beforeEach(() => {
    store.create();
  });

  afterEach(() => {
    store.reset();
  });

  it('should read global state', () => {
    createGlobalState({ name: 'foo', state: { message: 'hello' } });
    const Foo = () => {
      const state = useGlobalState();
      return <div>{state.foo.message}</div>
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('should read a specific global state', () => {
    createGlobalState({ name: 'foo', state: { message: 'hello' } });
    const Foo = () => {
      const state = useGlobalState('foo');
      return <div>{state.message}</div>
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('should read part of the global state', () => {
    createGlobalState({
      name: 'foo',
      state: {
        messages: {
          data: {
            list: [
              { message: 'hello' },
              { message: 'world' },
            ],
          },
        },
      },
    });
    const Foo = () => {
      const state = useGlobalState('foo.messages.data.list.*.message');
      return <div>{state.join(' ')}</div>
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });
});
