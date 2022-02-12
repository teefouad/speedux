/**
 * Dependency imports
 */
import { useRef, useEffect, useState } from 'react';
import { getType, mergeObjects } from 'noyb';

/**
 * useAsync
 */
export default (generatorFunction, initialState) => {
  const state = useRef(initialState);
  const argsRef = useRef([]);
  const iterator = useRef();
  const hasError = useRef(false);
  const promiseResolve = useRef();
  const promiseReject = useRef();
  const nextValue = useRef();
  const [nextResult, setNextResult] = useState();

  const iterate = (...args) => {
    if (iterator.current === undefined) {
      iterator.current = generatorFunction(...args);
    }

    const next = iterator.current.next(nextValue.current);

    const checkForNextResult = () => {
      if (!next.done) {
        setNextResult(next);
      } else {
        if (hasError.current !== false && promiseReject.current) {
          promiseReject.current(hasError.current);
        } else
        if (promiseResolve.current) {
          promiseResolve.current(state.current);
        }

        iterator.current = undefined;
      }
    };

    if (next.value instanceof Promise) {
      next.value.then((resolvedValue) => {
        nextValue.current = resolvedValue;
      }).catch((err) => {
        nextValue.current = err;
        hasError.current = err;
      }).finally(checkForNextResult);
    } else {
      if (getType(state.current) === 'object') {
        state.current = mergeObjects(state.current, next.value ?? {});
      } else {
        state.current = next.value;
      }

      checkForNextResult();
    }
  };

  const cancel = () => {
    if (iterator.current) iterator.current.return();
  };

  const execute = (...args) => {
    cancel();

    argsRef.current = args;

    return new Promise((resolve, reject) => {
      promiseResolve.current = resolve;
      promiseReject.current = reject;
      iterate(...argsRef.current);
    });
  };

  useEffect(() => {
    if (nextResult) iterate(...argsRef.current);
  }, [nextResult]);

  return [
    state.current,
    execute,
    cancel,
  ];
};
