const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Plusieurs points d'entrée si tu veux plusieurs pages plus tard
  entry: {
    main: './js/main.js',
    // simple: './js/simple.js', // ajoute d'autres si tu veux d'autres pages
  },
  output: {
    filename: '[name].bundle.js', // ça donne "main.bundle.js"
    path: path.resolve(__dirname, 'public'),
    clean: true, // nettoie le dossier à chaque build
  },
  mode: 'development', // change en 'production' pour le build final
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
      filename: 'index.html', // nom du fichier de sortie
      template: './index.html', // fichier source HTML
      chunks: ['main'], // injecte le bon script pour ce fichier
    }),
    // Tu pourrais rajouter d'autres pages comme ça :
    /*
    new HtmlWebpackPlugin({
      filename: 'simpl.html',
      template: './simpl.html',
      chunks: ['simple'],
    }),
    */
  ],
};
