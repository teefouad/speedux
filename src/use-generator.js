/**
 * Dependency imports
 */
import { useRef, useEffect, useState } from 'react';
import { getType, mergeObjects } from 'noyb';

export default (generatorFunction, defaultValue) => {
  const data = useRef(defaultValue);
  const nextValue = useRef();
  const iterator = useRef();
  const [nextResult, setNextResult] = useState();

  const execute = async (...args) => {
    if (iterator.current === undefined) {
      iterator.current = generatorFunction(...args);
    }

    const next = iterator.current.next(nextValue.current);
    const checkForNextResult = () => {
      if (!next.done) {
        setNextResult(next);
      } else {
        iterator.current = undefined;
      }
    };

    if (next.value instanceof Promise) {
      next.value.then((resolvedValue) => {
        nextValue.current = resolvedValue;
      }).catch((err) => {
        nextValue.current = err;
      }).finally(checkForNextResult);
    } else {
      if (getType(data.current) === 'object') {
        data.current = mergeObjects(data.current, next.value ?? {});
      } else {
        data.current = next.value;
      }

      checkForNextResult();
    }
  };

  useEffect(() => {
    if (nextResult) execute();
  }, [nextResult]);

  return [data.current, execute];
};
