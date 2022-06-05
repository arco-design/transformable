import path from 'path';
import ServePlugin from 'rollup-plugin-serve';
const SourceMapPlugin = require('rollup-plugin-sourcemaps');
const autoprefixer = require('autoprefixer');
const url = require('postcss-url');
const ResolvePlugin = require('rollup-plugin-node-resolve');
const CommonjsPlugin = require('rollup-plugin-commonjs');
const BabelPlugin = require('rollup-plugin-babel');
const PostcssPlugin = require('rollup-plugin-postcss');
const AliasPlugin = require('rollup-plugin-alias');
const ReplacePlugin = require('rollup-plugin-replace');
const HtmlPlugin = require('rollup-plugin-template-html');
const rootPath = path.resolve(__dirname);

export default {
    input: path.resolve(rootPath, 'pages/index.jsx'),
    output: {
        file: 'dev-dist/home.js',
        format: 'iife',
        sourcemap: true,
    },
    plugins: [
        HtmlPlugin({
          template: path.resolve(rootPath, 'templates/index.html'),
          filename: 'index.html'
        }),
        ResolvePlugin(),
        BabelPlugin({
            exclude: 'node_modules/**',
            babelrc: false,
            presets: [['@babel/env', { modules: false, loose: true }], '@babel/react'],
            plugins: ['@babel/proposal-class-properties', 'babel-plugin-operator'],
        }),
        CommonjsPlugin({
            include: 'node_modules/**',
            namedExports: {
                'node_modules/react/index.js': ['Children', 'Component', 'PureComponent', 'createElement'],
                'node_modules/react-dom/index.js': ['render'],
            },
        }),
        PostcssPlugin({
            extract: false,
            minimize: false,
            use: [
                ['less'],
            ],
            plugins: [
                autoprefixer,
                url({ url: 'inline' }),
            ],
        }),
        AliasPlugin({
            resolve: ['*', '.jsx', '/index.jsx', '.js', '/index.js'],
        }),
        ReplacePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
        }),
        ServePlugin({
            open: false,
            host: '0.0.0.0',
            port: 9191,
            contentBase: 'dev-dist',
            historyApiFallback: true
        }),
        SourceMapPlugin(),
    ],
    watch: {
        include: '**',
        exclude: 'node_modules/**'
    }
}
