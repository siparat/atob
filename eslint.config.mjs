import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ files: ['**/*.{js,mjs,cjs,ts}'] },
	{ files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	prettierPlugin,
	prettierConfig,
	{
		rules: {
			'@typescript-eslint/interface-name-prefix': 'off',
			'@typescript-eslint/explicit-function-return-type': 'warn',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': [
				'warn',
				{
					ignoreRestArgs: true
				}
			],
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					ignoreRestSiblings: true,
					caughtErrors: 'none'
				}
			],
			'prettier/prettier': [
				'warn',
				{
					useTabs: true,
					indentSize: 4,
					singleQuote: true,
					trailingComma: 'none',
					printWidth: 120,
					semi: true,
					bracketSpacing: true,
					bracketSameLine: true,
					arrowParens: 'always',
					parser: 'typescript',
					endOfLine: 'lf'
				}
			]
		}
	}
];
