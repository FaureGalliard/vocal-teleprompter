import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist', 'src-tauri'] },
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: { globals: globals.browser },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            // The classic hook rules; the React Compiler ones don't apply
            // since the app doesn't use the compiler
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // Small files are easier to read and review: split anything longer
            'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
        },
    },
)
