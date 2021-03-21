/**
 * Dependency imports
 */
import { useRef, useEffect, useState } from 'react';

export default (generatorFunction) => {
  const data = useRef();
  const nextValue = useRef();
  const iterator = useRef(generatorFunction());
  const [nextResult, setNextResult] = useState();

  const execute = async () => {
    const next = iterator.current.next(nextValue.current);

    if (next.value instanceof Promise) {
      next.value.then((resolvedValue) => {
        nextValue.current = resolvedValue;
      }).catch((err) => {
        nextValue.current = err;
      }).finally(() => {
        if (!next.done) setNextResult(next);
      });
    } else {
      data.current = next.value;
      if (!next.done) setNextResult(next);
    }
  };

  useEffect(() => {
    if (nextResult) execute();
  }, [nextResult]);

  return [data.current, execute];
};
