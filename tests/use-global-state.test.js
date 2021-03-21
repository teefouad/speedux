import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import Provider from '../src/provider';
import store from '../src/store';
import createGlobalState from '../src/create';
import useGlobalState from '../src/use-global-state.js';

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

  it('should set the global state', () => {
    createGlobalState({ name: 'foo', state: { message: 'hello' } });
    const Foo = () => {
      const state = useGlobalState('foo', { label: 'Foo Label' });
      return <div>{state.label}</div>
    }
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('Foo Label')).toBeInTheDocument();
  });
});
