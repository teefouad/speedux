import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { useReducer, useMiddleware } from '../src/index';
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
