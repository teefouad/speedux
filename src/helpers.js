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
 * Uses a string path to search for a direct property in an object and return its value or
 * replace it if a new value is provided.
 * @param {Object}  obj           Object to search.
 * @param {String}  prop          String that represents the property name.
 * @param {Any}     value         New value to replace the property with. Omit this
 *                                parameter if you just want to read the property.
 * @return {Object}               Value of the property or a copy of the same object updated
 *                                with the provided value.
 */
export const findDirectPropInObject = (obj, prop, copyByRef = false, ...args) => {
  const type = getObjectType(obj);
  const propType = getObjectType(obj[prop]);
  const shouldReplace = args.length > 0;
  const value = args[0];

  // cannot work with types other than arrays and objects
  if (type !== 'array' && type !== 'object') {
    return obj;
  }

  // start with a reference to the given object
  let result = obj;

  // de-reference, if that is required
  if (!copyByRef) {
    if (type === 'array') {
      result = [...obj];
    }

    if (type === 'object') {
      result = { ...obj };
    }
  }

  // handle an empty prop name
  if (prop === '') {
    if (shouldReplace) {
      // trying to write to an empty path on an object or an array would
      // result in the same given object or array
      return result;
    }

    // trying to read an empty path results in 'undefined' value
    return undefined;
  }

  // handle a wildcard
  if (prop === '*') {
    if (shouldReplace) {
      if (type === 'array') {
        if (value === undefined) {
          while (result.length) {
            findDirectPropInObject(result, 0, true, value);
          }
        } else {
          const { length } = result;

          // traverse the array end-to-start to make sure splicing
          // items does not affect the current index
          result.forEach((item, index) => {
            const itemIndex = length - 1 - index;
            let itemValue = value;

            if (getObjectType(value) === 'function') {
              itemValue = value(result[itemIndex]);
            }

            if (itemValue === undefined) {
              findDirectPropInObject(result, itemIndex, true, undefined);
            } else {
              const newResult = findDirectPropInObject(result, itemIndex, copyByRef, itemValue);
              result[itemIndex] = newResult[itemIndex];
            }
          });
        }
      } else
      if (type === 'object') {
        Object.keys(result).forEach(key => findDirectPropInObject(result, key, true, value));
      }

      return result;
    }

    // reading a wildcard on an array would return the values
    // of the given array
    if (type === 'array') {
      return result;
    } else
    // reading a wildcard on an object would return the values
    // of the given object
    if (type === 'object') {
      return Object.values(result);
    }
  }

  // handle other values
  if (shouldReplace) {
    let replaceWith = value;

    if (getObjectType(replaceWith) === 'function') {
      replaceWith = replaceWith(result[prop]);
    }

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

  // return the value of the prop
  return result[prop];
};

/**
 * Uses a string path to search for a property in an object and return its value or
 * replace it if a new value is provided.
 * @param {Object}  obj           Object to search.
 * @param {String}  pathStr       String that represents the property path.
 *                                For example: data.entries[0][3].title
 * @param {Any}     value         New value to replace the property with. Omit this
 *                                parameter if you just want to read the property.
 * @return {Object}               Value of the property or a copy of the same object updated
 *                                with the provided value.
 */
export const findPropInObject = (obj, pathStr, copyByRef = false, ...args) => {
  const type = getObjectType(obj);
  const shouldReplace = args.length > 0;
  const value = args[0];

  // clean and convert the path string into an array
  let path = pathStr.toString().replace(/^\[|\]$/g, ''); // remove starting and ending brackets
  path = path.replace(/\[|\]/g, '.'); // convert all brackets to dots
  path = path.replace(/\.{2,}/g, '.'); // remove dot duplications
  path = path.split('.'); // break the string at the dots

  if (path.length === 1) {
    if (shouldReplace) {
      return findDirectPropInObject(obj, path[0], copyByRef, value);
    }

    return findDirectPropInObject(obj, path[0], copyByRef);
  }

  // start with a reference to the given object
  let result = obj;

  // de-reference, if that is required
  if (!copyByRef) {
    if (type === 'array') {
      result = [...obj];
    }

    if (type === 'object') {
      result = { ...obj };
    }
  }

  const prop = path[0];
  const remainingPath = path.slice(1).join('.');

  if (shouldReplace) {
    // if the current path component is a wildcard, each item would have
    // to be mapped with value returned from the remaining path
    if (prop === '*') {
      if (type === 'array') {
        result.forEach((item, index) => {
          result[index] = findPropInObject(item, remainingPath, copyByRef, value);
        });
      }

      if (type === 'object') {
        Object.keys(result).forEach((key) => {
          result[key] = findPropInObject(result[key], remainingPath, copyByRef, value);
        });
      }

      return result;
    }

    if (typeof result[prop] === 'undefined') {
      result[prop] = {};
    }

    result[prop] = findPropInObject(result[prop], remainingPath, copyByRef, value);

    return result;
  }

  // if the current path component is a wildcard, each item would have
  // to be mapped with value returned from the remaining path
  if (prop === '*') {
    if (type === 'array') {
      return result.map(item => findPropInObject(item, remainingPath, copyByRef));
    }

    if (type === 'object') {
      return Object.values(result).map(item => findPropInObject(item, remainingPath, copyByRef));
    }
  }

  // the `|| {}` part handles undefined values, it will return `undefined` instead
  // of throwing an error
  return findPropInObject(result[prop] || {}, remainingPath, copyByRef);
};
