import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: true,
  rules: {
    'no-console': 'warn',
    'array-callback-return': 'off',
  },
})
