import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import Provider from '../src/provider';
import store from '../src/store';
import createGlobalState from '../src/create';
import useActions from '../src/use-actions';
import useHandler from '../src/use-handler';
import useDispatch from '../src/use-dispatch';

describe('use-handler', () => {
  beforeEach(() => {
    store.create();
  });

  afterEach(() => {
    store.reset();
  });

  it('should handle an action', () => {
    const listener = jest.fn();
    const action = { type: 'FOO_ACTION', value: 404 };
    const Foo = () => {
      const dispatch = useDispatch();
      return (
        <div>
          <button onClick={() => dispatch(action)}>
            Click
          </button>
        </div>
      );
    };
    const Baz = () => {
      useHandler('FOO_ACTION', listener);
      return null;
    };
    render(<Provider><Foo /><Baz /></Provider>);
    userEvent.click(screen.getByText('Click'));
    expect(listener).toHaveBeenCalledWith(action);
  });

  it('should handle a prefixed action', () => {
    const listener = jest.fn();
    const action = { type: '@@foo/FOO_ACTION', value: 404 };
    const Foo = () => {
      const dispatch = useDispatch();
      return (
        <div>
          <button onClick={() => dispatch(action)}>
            Click
          </button>
        </div>
      );
    };
    const Baz = () => {
      useHandler('@@foo/FOO_ACTION', listener);
      return null;
    };
    render(<Provider><Foo /><Baz /></Provider>);
    userEvent.click(screen.getByText('Click'));
    expect(listener).toHaveBeenCalledWith(action);
  });

  it('should handle an action using dot notation', () => {
    createGlobalState({
      name: 'foo',
      actions: {
        fooAction() {}
      },
    })
    const listener = jest.fn();
    const Foo = () => {
      const actions = useActions('foo');
      return (
        <div>
          <button onClick={() => actions.fooAction()}>
            Click
          </button>
        </div>
      );
    };
    const Baz = () => {
      useHandler('foo.fooAction', listener);
      return null;
    };
    render(<Provider><Foo /><Baz /></Provider>);
    userEvent.click(screen.getByText('Click'));
    expect(listener).toHaveBeenCalledWith({ type: '@@foo/FOO_ACTION', payload: {} });
  });
});
