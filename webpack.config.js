const path = require('path');

module.exports = {
  entry: './lib/app.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '.'),
    clean: false
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json'],
    fallback: {
      "fs": false,
      "path": false,
      "os": false,
      "crypto": false
    }
  },
  optimization: {
    minimize: false
  },
  target: 'web'
};