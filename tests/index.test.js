import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { useReducer, useMiddleware } from '../src/index';
import createGlobalState from '../src/create';
import Provider from '../src/provider';
import store from '../src/store';

describe('index', () => {
  beforeEach(() => {
    store.create();
  });
  
  afterEach(() => {
    store.reset();
  });

  it('should render content through the Provider', () => {
    render(<Provider>hello world</Provider>);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('should be able to query the state using store', () => {
    createGlobalState({
      name: 'foo',
      state: {
        root: {
          data: [{ message: 'hello world' }],
        },
      },
    });
    const message = store.getState('foo.root.data[0].message');
    expect(message).toBe('hello world');
  });

  it('should be able to populate an object from the store state', () => {
    createGlobalState({
      name: 'foo',
      state: {
        root: {
          data: [{ message: 'hello world' }],
        },
      },
    });
    createGlobalState({
      name: 'baz',
      state: {
        root: {
          info: 123,
          tags: {
            list: [10, 20, 30],
          },
        },
      },
    });
    const state = store.getState({
      message: 'foo.root.data[0].message',
      thirdTag: 'baz.root.tags.list[2]',
      info: 'baz.root.info',
    });
    expect(state).toEqual({
      message: 'hello world',
      thirdTag: 30,
      info: 123,
    });
  });

  it('should be able to use a custom reducer', () => {
    const reducer = jest.fn(() => ({ foo: 'baz' }));
    useReducer('test', reducer);
    render(<Provider />);
    expect(reducer).toHaveBeenCalled();
    expect(store.getInstance().getState()).toMatchObject({ test: { foo: 'baz' } });
  });

  it('should be able to use a custom middleware', () => {
    store.reset();
    const middleware = jest.fn(() => next => action => next(action));
    useMiddleware(middleware);
    render(<Provider />);
    expect(middleware).toHaveBeenCalled();
  });
});
