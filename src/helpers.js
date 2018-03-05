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
export const findPropInObject = (obj, pathStr, copyByRef = false, ...replaceWith) => {
  const type = getObjectType(obj);
  const shouldReplace = replaceWith.length > 0;

  let result = obj;

  if (!copyByRef) {
    if (type === 'array') {
      result = [...obj];
    }

    if (type === 'object') {
      result = { ...obj };
    }
  }

  if (pathStr === '') {
    if (shouldReplace) {
      return result;
    }

    return undefined;
  }

  if (pathStr === '*') {
    if (shouldReplace) {
      if (type === 'array') {
        result.forEach((item, index) => { [result[index]] = replaceWith; });
      }

      if (type === 'object') {
        Object.keys(result).forEach((key) => { [result[key]] = replaceWith; });
      }
    }

    return result;
  }

  let path = pathStr.replace(/^\[|\]$/g, '');
  path = path.replace(/\[|\]|\.]/g, '.');
  path = path.replace(/\.{2,}/g, '.');
  path = path.split('.');

  let currentTarget = result;
  let seenWildcard = false;

  for (let pos = 0; pos < path.length; pos += 1) {
    const prop = path[pos];

    if (pos < path.length - 1) {
      if (prop === '*') {
        seenWildcard = true;

        if (shouldReplace) {
          const currentType = getObjectType(currentTarget);
          const currentTargetKeys = Object.keys(currentType === 'array' ? { ...currentTarget } : currentTarget);

          for (let j = 0; j < currentTargetKeys.length; j += 1) {
            const key = currentTargetKeys[j];
            const keyType = getObjectType(currentTarget[key]);

            if (keyType === 'object' || keyType === 'array') {
              currentTarget[key] = findPropInObject(
                currentTarget[key],
                path.slice(pos + 1).join('.'),
                copyByRef,
                ...replaceWith,
              );
            } else {
              [currentTarget[key]] = replaceWith;
            }
          }

          break;
        }
      }

      currentTarget = findPropInObject(currentTarget, prop, copyByRef);
    }

    if (pos === path.length - 1) {
      if (shouldReplace) {
        if (prop === '*') {
          findPropInObject(currentTarget, prop, true, ...replaceWith);
        } else {
          [currentTarget[prop]] = replaceWith;
        }

        return result;
      }

      if (path.length > 1) {
        if (seenWildcard) {
          if (getObjectType(currentTarget) === 'array') {
            return currentTarget.map(item =>
              findPropInObject(item, prop, copyByRef));
          }

          if (getObjectType(currentTarget) === 'object') {
            return Object.values(currentTarget).map(item =>
              findPropInObject(item, prop, copyByRef));
          }
        }

        return findPropInObject(currentTarget, prop, copyByRef);
      }

      return currentTarget[prop];
    }
  }

  return result;
};
