const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './js/main.js',
    simple: './js/simple.js', // ← Active cette ligne
    kevin:'./js/kevin.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
    clean: true,
  },
  mode: 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html',
      chunks: ['main'],
    }),
    new HtmlWebpackPlugin({
      filename: 'simple.html',       // ← Génère public/simple.html
      template: './simple.html',     // ← Doit exister à la racine
      chunks: ['simple'],            // ← Utilise simple.bundle.js
    }),
    new HtmlWebpackPlugin({
      filename: 'kevin.html',       // ← Génère public/simple.html
      template: './kevin.html',     // ← Doit exister à la racine
      chunks: ['kevin'],            // ← Utilise simple.bundle.js
    }),
  ],
};
