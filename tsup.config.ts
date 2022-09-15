import { defineConfig } from 'tsup'
import fs from 'fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export default defineConfig({
  esbuildOptions(options, context) {
    // options.define.foo = '"bar"'
    options.supported = { 'dynamic-import': false }
  },
})
