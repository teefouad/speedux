import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import Provider from '../src/provider';
import store from '../src/store';
import useGenerator from '../src/use-generator';

describe('use-generator', () => {
  beforeEach(() => {
    store.create();
  });

  afterEach(() => {
    store.reset();
  });

  it('should consume a generator', () => {
    const Foo = () => {
      const [data, exec] = useGenerator(function* () {
        yield 1;
        yield 2;
        yield 3;
      });
      return (
        <div>
          <div>{data}</div>
          <button onClick={exec}>
            Click
          </button>
        </div>
      );
    };
    render(<Provider><Foo /></Provider>);
    expect(screen.queryByText('3')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should resolve a promise within a generator', async () => {
    const Foo = () => {
      const [data, exec] = useGenerator(function* () {
        yield 0;
        const v = yield Promise.resolve(10);
        yield v;
      });
      return (
        <div>
          <div>{data}</div>
          <button onClick={exec}>
            Click
          </button>
        </div>
      );
    };
    render(<Provider><Foo /></Provider>);
    expect(screen.queryByText('10')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('10')).toBeInTheDocument();
  });

  it('should handle errors in a generator', async () => {
    const Foo = () => {
      const [data, exec] = useGenerator(function* () {
        const response = yield Promise.reject(new Error('whoops'));
        yield { error: response instanceof Error };
      }, { error: false });
      return (
        <div>
          <div>{data.error ? 'has error' : ''}</div>
          <button onClick={exec}>
            Click
          </button>
        </div>
      );
    };
    render(<Provider><Foo /></Provider>);
    expect(screen.queryByText('has error')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('has error')).toBeInTheDocument();
  });

  it('should handle errors in a generator by returning a value', async () => {
    const faultyFetchData = () => Promise.reject(new Error());
    const Foo = () => {
      const [data, exec] = useGenerator(function* () {
        const response = yield faultyFetchData().catch(() => {
          return {
            content: 'request failed',
          };
        });
        yield { content: response.content };
      });
      return (
        <div>
          <div>{data?.content ?? 'no data'}</div>
          <button onClick={exec}>
            Click
          </button>
        </div>
      );
    };
    render(<Provider><Foo /></Provider>);
    expect(screen.getByText('no data')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('request failed')).toBeInTheDocument();
  });
});
