import { defineConfig } from 'tsup'

export default defineConfig({
  esbuildOptions(options, context) {
    options.supported = { 'dynamic-import': false }
  },
})
