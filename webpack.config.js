const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    // Add your entry points here
    // For example: main: './web/themes/custom/arsapps_theme/src/js/main.js'
  },
  output: {
    path: path.resolve(__dirname, 'web/themes/custom'),
    filename: '[name]/dist/js/[name].bundle.js',
    clean: true,
  },
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
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};