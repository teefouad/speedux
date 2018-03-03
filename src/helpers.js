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
export const findPropInObject = (obj, pathStr, ...replaceWith) => {
  const path = pathStr.replace(/\]$/, '').split(/\]\[|\]\.|\[|\]|\./);
  let currentType = getObjectType(obj);
  let returnObj = currentType === 'array' ? [...obj] : { ...obj };
  let currentPath = returnObj;

  for (let i = 0; i < path.length; i += 1) {
    const prop = path[i];

    if (prop === '*') {
      const list = Object.keys(currentType === 'array' ? { ...currentPath } : currentPath);

      for (let j = 0; j < list.length; j += 1) {
        currentPath[list[j]] = findPropInObject(currentPath[list[j]], path.slice(i + 1).join('.'), ...replaceWith);
      }

      break;
    }

    currentType = getObjectType(currentPath[prop]);

    // de-reference the value if it's an object
    if (currentType === 'object') {
      currentPath[prop] = {
        ...currentPath[prop],
      };
    }

    // de-reference the value if it's an array
    if (currentType === 'array') {
      currentPath[prop] = [...currentPath[prop]];
    }

    // create it if it doesn't exist
    if (currentType === 'undefined' && replaceWith.length !== 0) {
      currentPath[prop] = {};
    }

    if (i < path.length - 1) {
      // keep digging through the object
      currentPath = currentPath[prop];
    } else
    if (replaceWith.length !== 0) {
      // replace the deepest value, if needed
      [currentPath[prop]] = replaceWith;
    } else {
      // return the deepest value, if there is no new value to set
      returnObj = currentPath[prop];
    }
  }

  return returnObj;
};
