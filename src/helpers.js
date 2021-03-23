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
