import path from 'path';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import cleanup from 'rollup-plugin-cleanup';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import noderesolve from 'rollup-plugin-node-resolve';
import pkg from '../package.json';

const {version, author, name} = pkg;

const resolve = p => {
    return path.resolve(__dirname, p)
};

const banner =`/*!
* ${name} v${version}
* (c) ${new Date().getFullYear()} ${author}
*/`;

const babelRuntime = () => {
    return babel({
        runtimeHelpers: true,
        plugins: [
            ["@babel/plugin-transform-runtime",
                {
                    "regenerator": true
                }
            ]
        ]
    });
};

const pluginsCommon = [
    noderesolve(),
    replace({
        __VER__: version
    }),
    cleanup(),
];

const envPlugins = (env) => {
    return replace({
          'process.env.NODE_ENV': JSON.stringify(env),
        },
    );
};

const configs = [
    {
        input: resolve('../src/index.js'),
        plugins: pluginsCommon.concat([
            babelRuntime(),
            commonjs(),
            envPlugins('development'),
        ]),
        output: {
            file: resolve(`../output/resource/cdn/js/transformable.js`),
            format: 'umd',
            name: 'Transformable',
            banner,
        }
    },
    {
        input: resolve('../src/index.js'),
        plugins: pluginsCommon.concat([
            babelRuntime(),
            commonjs(),
            uglify(),
            envPlugins('production'),
        ]),
        output: {
            file: resolve(`../output/resource/cdn/novel_transformable/js/transformable.min.js`),
            format: 'umd',
            name: 'Transformable',
            banner,
        }
    },
    {
        input: resolve('../src/index.js'),
        plugins: pluginsCommon.concat([
            babel(),
            commonjs(),
        ]),
        output: {
            file: resolve('../dist/transformable.es.js'),
            format: 'es',
            name: 'Transformable',
            banner,
        }
    },
    {
        input: resolve('../src/index.js'),
        plugins: pluginsCommon.concat([
            babel(),
            commonjs(),
        ]),
        output: {
            file: resolve('../dist/transformable.common.js'),
            format: 'cjs',
            name: 'Transformable',
            banner,
        }
    },
];

export default configs;
