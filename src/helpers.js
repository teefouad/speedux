/**
 * Extracts parameters of a function as an array.
 * @param   {Function}  func  Reference to the function.
 * @return  {Array}           An array of argument names the function expects to receive.
 */
export const getArgNames = (func) => {
  // convert the function to a string and remove spaces
  const str = func.toString().replace(/\s+/g, '');

  // `params` is a comma-separated string representing the
  // parameters that the function expects
  let params = (str.match(/function(.*?)\(+(.*?)\)+\{+(.*?)\}+/) || [])[2];

  // not a normal function, check if it is an arrow function
  if (!params) {
    if (str[0] === '(') {
      let i = 1;
      let p = 1;

      for (; i < str.length; i += 1) {
        if (str[i] === '(') p += 1;
        if (str[i] === ')') p -= 1;
        if (str[i] === '=' && str[i + 1] === '>' && p === 0) {
          params = str.slice(0, i);
          break;
        }
      }
    } else {
      [params] = (str.match(/(.*?)(?==>)/) || []);
    }
  }

  // handle destructuring, renaming and default values
  // [{}()\s]     -> destructuring
  // (.*?):       -> renaming
  // =(.*?)(?=,)  -> default values
  // =(.*?)$      -> last parameter default value
  params = params && params.replace(/[{}()\s]|(.*?):|=(.*?)(?=,)|=(.*?)$/g, '');

  // return an array of parameters
  return (params && params.split(',')) || [];
};

/**
 * Returns type of a given object.
 * @param   {Any}     obj   Object to inspect for type.
 * @return  {String}        Type of the given object.
 */
export const getObjectType = (obj) => {
  const typeString = Object.prototype.toString.call(obj);
  return typeString.toLowerCase().replace(/\[object\s|\]/g, '');
};

/**
 * Uses a string path to search for a property in an object and return its value or
 * replace it if a new value is provided.
 * @param {Object}  obj           Object to search.
 * @param {String}  pathStr       String that represents the property path.
 *                                For example: data.entries[0][3].title
 * @param {Any}     replaceWith   New value to replace the property with. Omit this
 *                                parameter if you just want to read the property.
 * @return {Object}               The property and its value wrapped in an object.
 */
export const findPropInObject = (obj, pathStr, copyByRef = false, ...args) => {
  // get type of the given object
  const type = getObjectType(obj);
  const shouldReplace = args.length > 0;
  const replaceWith = args[0];

  // cannot work with types other than arrays and objects
  if (type !== 'array' && type !== 'object') {
    return obj;
  }

  // start with a reference to the given object
  let result = obj;

  // de-reference if that is required
  if (!copyByRef) {
    if (type === 'array') {
      result = [...obj];
    }

    if (type === 'object') {
      result = { ...obj };
    }
  }

  // the path is not empty and not a wildcard
  // clean and convert the path string into an array
  let path = pathStr.toString().replace(/^\[|\]$/g, ''); // remove starting and ending brackets
  path = path.replace(/\[|\]/g, '.'); // convert all brackets to dots
  path = path.replace(/\.{2,}/g, '.'); // remove dot duplications
  path = path.split('.'); // break the string at the dots

  /**
   * SHORT PATH (SINGLE PROP)
   */
  // if it's just a single prop, either return its value or write to it
  if (path.length === 1) {
    const prop = path[0];
    const propType = getObjectType(result[prop]);

    /**
     * EMPTY PATH
     */
    if (prop === '') {
      if (shouldReplace) {
        // trying to write to an empty path on an object or an array would
        // result in the same given object or array
        return result;
      }

      // trying to read an empty path results in 'undefined' value
      return undefined;
    }

    /**
     * WILDCARD
     */
    if (prop === '*') {
      if (shouldReplace) {
        // writing to a wildcard on an array would result in updating
        // all items of the array with the given value
        if (type === 'array') {
          result.forEach((item, index) => { findPropInObject(result, index, true, replaceWith); });
        }

        // writing to a wildcard on an object would result in updating
        // all keys of the object with the given value
        if (type === 'object') {
          Object.keys(result).forEach(key => findPropInObject(result, key, true, replaceWith));
        }

        // return the updated result
        return result;
      }

      // reading a wildcard on an object would return the values
      // of the given object (arrays are returned by the next statement)
      if (type === 'object') {
        return Object.values(result);
      }

      return result;
    }

    /**
     * OTHER VALUES
     */
    if (shouldReplace) {
      // update the value then return the resulting object
      if (replaceWith === undefined && type === 'array') {
        result.splice(prop, 1);
      } else
      if (replaceWith === undefined && type === 'object') {
        delete result[prop];
      } else {
        result[prop] = replaceWith;
      }

      return result;
    }

    // copy by value, if required
    if (!copyByRef) {
      if (propType === 'array') {
        return [...result[prop]];
      }

      if (propType === 'object') {
        return { ...result[prop] };
      }
    }

    // return the read value
    return result[prop];
  }

  /**
   * LONG PATH (TWO OR MORE COMPONENTS)
   */
  if (shouldReplace) {
    // the currentTarget represent the current level that is being scanned
    // for the given property path
    let currentTarget = result;

    // iterate over all path components
    for (let pos = 0; pos < path.length; pos += 1) {
      const currentProp = path[pos];

      // if the current path component is a wildcard, each item would have
      // to be mapped with value returned from the remaining path
      if (currentProp === '*') {
        const currentTargetKeys = Object.keys(getObjectType(currentTarget) === 'array' ? { ...currentTarget } : currentTarget);

        for (let i = 0; i < currentTargetKeys.length; i += 1) {
          const key = currentTargetKeys[i];
          const keyType = getObjectType(currentTarget[key]);
          const nextPath = path.slice(pos + 1).join('.');

          if (nextPath !== '' && (keyType === 'object' || keyType === 'array')) {
            currentTarget[key] = findPropInObject(
              currentTarget[key],
              nextPath,
              copyByRef,
              replaceWith,
            );
          } else {
            currentTarget[key] = replaceWith;
          }
        }

        break;
      }

      if (pos === path.length - 1) {
        // if this is the last property in the path, update it with the
        // given value and update the resulting object
        const finalTarget = findPropInObject(currentTarget, currentProp, copyByRef, replaceWith);
        currentTarget[currentProp] = finalTarget[currentProp];
      } else {
        // otherwise, keep digging through the object
        currentTarget[currentProp] = findPropInObject(currentTarget, currentProp, copyByRef);
        currentTarget = currentTarget[currentProp];
      }
    }

    // return the updated object
    return result;
  }

  // get a reference to the next-level-object
  const nextObj = findPropInObject(result, path[0]);

  // if the current path component is a wildcard, each item would have
  // to be mapped with value returned from the remaining path
  if (path[0] === '*') {
    return nextObj.map(item => findPropInObject(item, path.slice(1).join('.')));
  }

  // keep digging through the object until the path is of a single prop
  // then the value will be returned
  return findPropInObject(nextObj, path.slice(1).join('.'));
};
