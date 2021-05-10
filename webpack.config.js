const path = require("path");
const webpack = require("webpack");
const stripIndent = require("common-tags").stripIndent;

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    firestarter: "./src/firestarter.ts",
  },
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "[name].user.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({
      raw: true,
      banner: stripIndent`
            // ==UserScript==
            // @name         firestarter
            // @namespace    firestarter
            // @version      2021.03.05
            // @description  Improved tinder UI & keyboard shortcuts
            // @author       RooTer
            // @match        https://tinder.com/*
            // @require      https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.js
            // @grant        GM_getValue
            // @grant        GM_setValue
            // @grant        GM_notification
            // ==/UserScript==
          `,
    }),
  ],
};
