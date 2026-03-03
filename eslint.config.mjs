import { dirname } from 'path'
import { fileURLToPath } from 'url'
import nextConfig from 'eslint-config-next'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextConfig,
  {
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },
]
