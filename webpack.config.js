const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const { NODE_ENV, FILE_NAME } = process.env;
const filename = `${FILE_NAME}${NODE_ENV === 'production' ? '.min' : ''}.js`;

module.exports = {
  mode: NODE_ENV || 'development',
  entry: [
    './src/index.js',
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename,
    libraryTarget: 'umd',
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules\/(?!(react-redux)\/).*/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
