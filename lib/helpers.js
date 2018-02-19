'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Extracts parameters of a function as an array.
 * @param   {Function}  func  Reference to the function.
 * @return  {Array}           An array of argument names the function expects to receive.
 */
var getArgNames = exports.getArgNames = function getArgNames(func) {
  // convert the function to a string and remove spaces
  var str = func.toString().replace(/\s+/g, '');

  // `params` is a comma-separated string representing the
  // parameters that the function expects
  var params = (str.match(/function(.*?)\(+(.*?)\)+\{+(.*?)\}+/) || [])[2];

  // not a normal function, check if it is an arrow function
  if (!params) {
    if (str[0] === '(') {
      var i = 1;
      var p = 1;

      for (; i < str.length; i += 1) {
        if (str[i] === '(') p += 1;
        if (str[i] === ')') p -= 1;
        if (str[i] === '=' && str[i + 1] === '>' && p === 0) {
          params = str.slice(0, i);
          break;
        }
      }
    } else {
      var _ref = str.match(/(.*?)(?==>)/) || [];

      var _ref2 = _slicedToArray(_ref, 1);

      params = _ref2[0];
    }
  }

  // handle destructuring, renaming and default values
  // [{}()\s]     -> destructuring
  // (.*?):       -> renaming
  // =(.*?)(?=,)  -> default values
  // =(.*?)$      -> last parameter default value
  params = params && params.replace(/[{}()\s]|(.*?):|=(.*?)(?=,)|=(.*?)$/g, '');

  // return an array of parameters
  return params && params.split(',') || [];
};

/**
 * Converts a Snake_Case string to camelCase format.
 * @param   {String}  str String to be converted.
 * @return  {String}      The converted string.
 */
var snake2CamelCase = exports.snake2CamelCase = function snake2CamelCase(str) {
  var lowercaseStr = str.toLowerCase();
  return lowercaseStr.replace(/_\w/g, function (w) {
    return w[1].toUpperCase();
  });
};

/**
 * Returns type of a given object.
 * @param   {Any}     obj   Object to inspect for type.
 * @return  {String}        Type of the given object.
 */
var getObjectType = exports.getObjectType = function getObjectType(obj) {
  var typeString = Object.prototype.toString.call(obj);
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
var findPropInObject = exports.findPropInObject = function findPropInObject(obj, pathStr) {
  for (var _len = arguments.length, replaceWith = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    replaceWith[_key - 2] = arguments[_key];
  }

  var path = pathStr.replace(/\]$/, '').split(/\]\[|\]\.|\[|\]|\./);
  var returnObj = _extends({}, obj);
  var currentPath = returnObj;

  path.forEach(function (prop, i) {
    var type = getObjectType(currentPath[prop]);

    // de-reference the value if it's an object
    if (type === 'object') {
      currentPath[prop] = _extends({}, currentPath[prop]);
    }

    // de-reference the value if it's an array
    if (type === 'array') {
      currentPath[prop] = [].concat(_toConsumableArray(currentPath[prop]));
    }

    if (i < path.length - 1) {
      // keep digging through the object
      currentPath = currentPath[prop];
    } else if (replaceWith.length !== 0) {
      currentPath[prop] = replaceWith[0];
      // replace the deepest value, if needed
    } else {
      // return the deepest value, if there is no new value to set
      returnObj = currentPath[prop];
    }
  });

  return returnObj;
};