import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import useAsync from '../src/use-async';

const delay = (timeout, value) => new Promise(resolve => setTimeout(resolve, timeout, value));

describe('useAsync', () => {

  test('should execute the function', () => {
    const Foo = () => {
      const [data, exec] = useAsync(function* () {
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
    render(<Foo />);
    expect(screen.queryByText('3')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('should be able to cancel function execution', async () => {
    const Foo = () => {
      const [data, exec, cancel] = useAsync(function* () {
        yield 1;
        yield delay(200);
        yield 2;
      });
      return (
        <div>
          <div>{data}</div>
          <button onClick={exec}>
            Click
          </button>
          <button onClick={cancel}>
            Cancel
          </button>
        </div>
      );
    };
    render(<Foo />);
    expect(screen.queryByText('1')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(screen.getByText('1')).toBeInTheDocument();
    userEvent.click(screen.getByText('Cancel'));
    await waitFor(async () => {
      await delay(400);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.queryByText('2')).toBeNull();
    });
  });

  test('should be able to auto-cancel when re-executed before finishing the last function execution', async () => {
    const Foo = () => {
      const [data, exec] = useAsync(function* (value) {
        yield `${value}:1`;
        yield delay(200);
        yield `${value}:2`;
      });
      return (
        <div>
          <div>{data}</div>
          <button onClick={() => exec('A')}>
            Click A
          </button>
          <button onClick={() => exec('B')}>
            Click B
          </button>
        </div>
      );
    };
    render(<Foo />);
    userEvent.click(screen.getByText('Click A'));
    expect(screen.getByText('A:1')).toBeInTheDocument();
    await waitFor(async () => {
      await delay(100);
      userEvent.click(screen.getByText('Click B'));
      expect(screen.getByText('B:1')).toBeInTheDocument();
      expect(screen.queryByText('A:1')).toBeNull();
    });
    await waitFor(async () => {
      await delay(400);
      expect(screen.getByText('B:2')).toBeInTheDocument();
    });
  });

  test('should be able to resolve a promise', async () => {
    const Foo = () => {
      const [data, exec] = useAsync(function* () {
        yield 0;
        const value = yield Promise.resolve(10);
        yield value;
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
    render(<Foo />);
    expect(screen.queryByText('10')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('10')).toBeInTheDocument();
  });

  test('should resolve the return of `exec()` upon completion', async () => {
    const Foo = () => {
      const [status, setStatus] = React.useState('start');
      const [, exec] = useAsync(function* () {
        yield 0;
        const v = yield Promise.resolve(10);
        yield v;
      });
      const onClick = async () => {
        await exec();
        setStatus('finish');
      };
      return (
        <div>
          <div>{status}</div>
          <button onClick={onClick}>
            Click
          </button>
        </div>
      );
    };
    render(<Foo />);
    expect(screen.getByText('start')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('finish')).toBeInTheDocument();
  });

  test('should reject the return of `exec()` upon error', async () => {
    const Foo = () => {
      const [status, setStatus] = React.useState('start');
      const [, exec] = useAsync(function* () {
        yield 0;
        const v = yield Promise.reject();
        yield v;
      });
      const onClick = () => {
        exec().catch(() => {
          setStatus('failed');
        });
      };
      return (
        <div>
          <div>{status}</div>
          <button onClick={onClick}>
            Click
          </button>
        </div>
      );
    };
    render(<Foo />);
    expect(screen.getByText('start')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('failed')).toBeInTheDocument();
  });

  test('should catch a failed promise inside the function', async () => {
    const faultyFetchData = () => Promise.reject(new Error());
    const Foo = () => {
      const [data, exec] = useAsync(function* () {
        const response = yield faultyFetchData().catch(() => {
          return 'request failed';
        });
        yield { content: response };
      }, { content: 'no data' });
      return (
        <div>
          <div>{data?.content}</div>
          <button onClick={exec}>
            Click
          </button>
        </div>
      );
    };
    render(<Foo />);
    expect(screen.getByText('no data')).toBeInTheDocument();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('request failed')).toBeInTheDocument();
  });

  test('should handle errors inside the function', async () => {
    const Foo = () => {
      const [data, exec] = useAsync(function* () {
        const response = yield Promise.reject(new Error('whoops'));
        const hasError = response instanceof Error;
        yield { error: hasError };
      }, { error: false });

      return (
        <div>
          <div>{data.error ? 'has error' : ''}</div>
          <button onClick={() => {
            exec().catch(() => null);
          }}>
            Click
          </button>
        </div>
      );
    };
    render(<Foo />);
    expect(screen.queryByText('has error')).toBeNull();
    userEvent.click(screen.getByText('Click'));
    expect(await screen.findByText('has error')).toBeInTheDocument();
  });
  
});
