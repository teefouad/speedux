const packageFile = require('./package.json');

module.exports = function babelConfig(api) {
  const { NODE_ENV, BABEL_ENV } = process.env;
  const cjs = NODE_ENV === 'test' || BABEL_ENV === 'commonjs';
  const loose = true;

  api.cache(true);

  const presets = [
    ['@babel/preset-env', { loose, modules: false }],
    '@babel/preset-react',
  ];
  const plugins = [
    '@babel/plugin-proposal-class-properties',
    cjs && ['@babel/transform-modules-commonjs', { loose }],
    ['@babel/plugin-transform-runtime', {
      useESModules: !cjs,
      version: packageFile.dependencies['@babel/runtime'].replace(/^[^0-9]*/, ''),
    }],
  ].filter(Boolean);

  return {
    presets,
    plugins,
  };
};
