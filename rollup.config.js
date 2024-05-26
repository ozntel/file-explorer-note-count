import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-import-css';
import { env } from 'process';

const isProd = env.NODE_ENV === 'production';

export default {
    input: 'src/main.ts',
    output: {
        file: isProd ? 'build/main.js' : 'main.js',
        sourcemap: !isProd,
        format: 'cjs',
        exports: 'default',
    },
    external: ['obsidian'],
    plugins: [
        typescript(),
        nodeResolve({ browser: true }),
        commonjs(),
        css({ output: 'styles.css' }),
        copy({
            targets: [{ src: 'manifest.json', dest: 'build' }],
        }),
    ],
};
