module.exports = function babelConfig(api) {
  api.cache(true);

  const presets = [
    '@babel/preset-env',
    '@babel/preset-react',
  ];
  const plugins = [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime',
  ];

  return {
    presets,
    plugins,
  };
};
