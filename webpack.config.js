var debug = process.env.NODE_ENV !== "prod";
var webpack = require('webpack');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var copyPatterns = [
    { from: "./manifest.json", to: "../manifest.json" },
    { from: "./img", to: "../img" },
    { from: "./css", to: "../css" },
    { from: "./views", to: "../views" }
];

module.exports = {
    mode: "production",
    context: __dirname + "/src",
    devtool: debug ? "inline-sourcemap" : null,
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                "style-loader", // creates style nodes from JS strings
                "css-loader", // translates CSS into CommonJS
                "sass-loader" // compiles Sass to CSS, using Node Sass by default
            ]
        }]
    },
    entry: {
        content: "./js/content.jsx",
        background: "./js/background.jsx",
        me: "./js/views/me.jsx",
        manage: "./js/views/manage.jsx",
        options: "./js/views/options.jsx",
        popup: "./js/views/popup.jsx"
    },
    output: {
        path: __dirname + "/build/js",
        filename: "[name].js"
    },
    plugins: debug ? [
        new CleanWebpackPlugin(['build']),
        new webpack.ProvidePlugin({ '$': 'jquery', 'Dexie': 'dexie', 'moment': 'moment', '_': 'lodash' }),
        new CopyWebpackPlugin(copyPatterns)
    ] : [
        new CleanWebpackPlugin(['build']),
        new webpack.ProvidePlugin({ '$': 'jquery', 'Dexie': 'dexie', 'moment': 'moment', '_': 'lodash' }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false, compress: false }),
        new CopyWebpackPlugin(copyPatterns),
    ],
};