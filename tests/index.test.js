import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import {
  Provider,
  getStore,
  useReducer,
  useMiddleware,
} from '../src';
import store from '../src/store';

describe('Tests', () => {
  afterEach(() => {
    cleanup();
    store.reset();
  });

  it('should render content through the Provider', () => {
    render(<Provider>content</Provider>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('should warn if a store is passed to Provider', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Provider />);
    expect(spy).toHaveBeenCalledTimes(0);
    render(<Provider store={null} />);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('should be able to use a custom reducer', () => {
    const reducer = jest.fn(() => ({ foo: 'baz' }));
    useReducer('test', reducer);
    render(<Provider />);
    expect(reducer).toHaveBeenCalled();
    expect(getStore().getState()).toMatchObject({ test: { foo: 'baz' }});
  });

  it('should be able to use a custom middleware', () => {
    const middleware = jest.fn(() => next => action => next(action));
    useMiddleware(middleware);
    render(<Provider />);
    expect(middleware).toHaveBeenCalled();
  });
});
