/**
 * Extracts parameters of a function as an array.
 * @param   {Function}  func          Reference to the function.
 * @return  {Array}                   An array of argument names the function expects to receive.
 */
export const getArgNames = (func) => {
  // convert the function to a string and remove spaces
  const str = func.toString().replace(/[\s*]+/g, '');

  // `params` is a comma-separated string representing the
  // parameters that the function expects
  let params = '';

  // check if the input is a normal function
  if (str.startsWith('function')) {
    let i = str.indexOf('(');
    let p = 0; // number of open parentheses

    for (; i < str.length; i += 1) {
      if (str[i] === '(') p += 1;
      if (str[i] === ')') p -= 1;
      if (p === 0) {
        params = str.slice(str.indexOf('('), i + 1);
        break;
      }
    }
  } else
  // not a normal function, check if it is an arrow function
  if (str[0] === '(') {
    let i = 0;
    let p = 0; // number of open parentheses

    for (; i < str.length; i += 1) {
      if (str[i] === '(') p += 1;
      if (str[i] === ')') p -= 1;
      if (str[i] === '=' && str[i + 1] === '>' && p === 0) {
        params = str.slice(0, i);
        break;
      }
    }
  } else {
    const [signature] = (str.match(/(.*?)(?=[=>{])/) || []);

    if (/(.*?)\((.*?)\)/.test(signature)) {
      // object shorthand function
      params = signature.replace(/^(.*?)\(|\)$/g, '');
    } else {
      // single param arrow function
      params = signature;
    }
  }

  // clear destructuring and parentheses
  params = params && params.replace(/[{}()\s.]/g, '');

  // convert to an array of un-clean parameters
  params = (params && params.split(',')) || [];

  // clean and return the parameters
  // (.*?): -> handle renaming
  // =.*$   -> handle default values
  return params.map(param => param.replace(/(.*?):/, '').replace(/=.*$/, ''));
};

/**
 * Returns type of a given object.
 * @param   {Any}       obj           Object to inspect for type.
 * @return  {String}                  Type of the given object.
 */
export const getObjectType = (obj) => {
  const typeString = Object.prototype.toString.call(obj);
  return typeString.toLowerCase().replace(/\[object\s|\]/g, '');
};

/**
 * Uses a string path to search for a direct property in an object and return its value or
 * replace it if a new value is provided.
 * @param   {Object}    obj           Object to search.
 * @param   {String}    prop          String that represents the property name.
 * @param   {Any}       value         New value to replace the property with. Omit this
 *                                    parameter if you just want to read the property. If the
 *                                    provided value is `undefined`, the property will be deleted.
 * @return  {Object}                  Value of the property or a copy of the same object updated
 *                                    with the provided value.
 */
export const findDirectPropInObject = (obj, prop, copyByRef = false, ...args) => {
  const type = getObjectType(obj);
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
    }

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

  // return the value of the prop
  return result[prop];
};

/**
 * Uses a string path to search for a property in an object and return its value or
 * replace it if a new value is provided.
 * @param   {Object}    obj           Object to search.
 * @param   {String}    pathStr       String that represents the property path.
 *                                    For example: data.entries[0][3].title
 * @param   {Any}       value         New value to replace the property with. Omit this
 *                                    parameter if you just want to read the property.
 * @return  {Object}                  Value of the property or a copy of the same object updated
 *                                    with the provided value.
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

/**
 * Updates an object by merging a fragment object into it.
 * @param   {Object} objA Object to update.
 * @param   {Object} objB Fragment object.
 * @return  {Object}      The updated object.
 */
export const mergeObjects = (objA, objB) => Object.keys(objB).reduce(
  (prev, next) => findPropInObject(prev, next, false, objB[next]),
  { ...objA },
);

/**
 * Queries a state object for a specific value.
 * @param   {String}    query   Query string.
 * @param   {Object}    state   State object to query.
 * @return  {Object}            The state object, part of it or a value in the state object.
 */
export const queryState = (query, state) => {
  // handle query strings
  if (getObjectType(query) === 'string') {
    return findPropInObject(state, query);
  }

  // handle query objects
  if (getObjectType(query) === 'object') {
    return Object.keys(query).reduce((prev, next) => ({
      ...prev,
      [next]: findPropInObject(state, query[next]),
    }), {});
  }

  return state;
};

/**
 * Converts any string to camel-case format.
 * @param   {String}    str           String to convert.
 * @return  {String}                  The formatted string.
 */
export const toCamelCase = (str) => {
  // remove spaces, dashes and underscores from the begining of the string
  // /^[A-Z]+$/ -> lowercases the string if it's all uppercase
  const cleanString = str.replace(/[^\w\s_-]/g, '').replace(/^[A-Z]+$/, w => w.toLowerCase());

  // if it's in snakecase, convert it to camelcase
  if (/(.*?)[\s_-]/.test(cleanString)) {
    const parts = cleanString.replace(/[\s_-]|[a-z](?=[A-Z])/g, w => (/[\s_-]/.test(w) ? ':' : `${w}:`)).split(':');
    const transformedParts = parts.map((w, i) => (i === 0 ? w.toLowerCase() : `${w[0].toUpperCase()}${w.slice(1).toLowerCase()}`));
    return transformedParts.join('');
  }

  // if it's already in camelcase, return it
  if (/([a-z][A-Z])+/.test(cleanString)) {
    return cleanString;
  }

  return cleanString;
};

/**
 * Converts any string to snake-case format.
 * @param   {String}    str           String to convert.
 * @return  {String}                  The formatted string.
 */
export const toSnakeCase = (str) => {
  const camelCase = toCamelCase(str);
  return camelCase.replace(/[a-z](?=[A-Z])/g, w => `${w[0]}_`).toLowerCase();
};

/**
 * Deep-copies an object or an array.
 * @param   {Object|Array}  obj       Object or Array to copy.
 * @return  {Object|Array}            Copied Object or Array.
 */
export const deepCopy = (obj) => {
  const type = getObjectType(obj);

  if (type === 'object' || type === 'array') {
    const newObj = (type === 'array' ? [] : {});

    Object.keys(obj).forEach((key) => {
      if (['object', 'array'].includes(getObjectType(obj[key]))) {
        newObj[key] = deepCopy(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    });

    return newObj;
  }

  return obj;
};

/**
 * Generates a component name based on the display name of the component or the function
 * name if it's a functional component.
 * @param   {Object}    component     Target component.
 * @return  {String}                  Component name as a string or null.
 */
export const getComponentName = (component) => {
  const displayName = component.displayName && `${component.displayName[0].toLowerCase()}${component.displayName.slice(1)}`;
  const functionName = component.name && `${component.name[0].toLowerCase()}${component.name.slice(1)}`;
  return displayName || functionName || null;
};

/**
 * Deeply compares two objects and returns a boolean that specifies whether the two
 * objects are equal
 * @param   {Object | Array} objA First object.
 * @param   {Object | Array} objB Second object.
 * @return  {Boolean}             Result is true if the two objects are equal.
 */
export const deepCompare = (objA, objB) => {
  const typeA = getObjectType(objA);
  const typeB = getObjectType(objB);

  if (typeA !== typeB) return false;

  if (typeA === 'object' || typeA === 'array') {
    const keys = Object.keys(objA);

    for (let i = 0; i < keys.length; i += 1) {
      const valueA = objA[keys[i]];
      const valueB = objB[keys[i]];

      if (!deepCompare(valueA, valueB)) {
        return false;
      }
    }
  }

  return objA?.toString() === objB?.toString();
};
