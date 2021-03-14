const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: "./dev/index.js",
  stats: "errors-only",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "../example"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.styl(us)?$/,
        use: ["style-loader", "css-loader", "stylus-loader"],
      },
    ],
  },
  devServer: {
    clientLogLevel: "silent",
    contentBase: path.join(__dirname, "static"),
    hot: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "dev/index.html",
      inject: true,
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
};
