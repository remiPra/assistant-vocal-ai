// webpack.config.js
const path = require('path');

module.exports = {
  entry: './js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),  // Changez 'dist' en 'public'
  },
  mode: 'development',
};