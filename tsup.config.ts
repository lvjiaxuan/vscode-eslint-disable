import { defineConfig } from 'tsup'

export default defineConfig({
  esbuildOptions(options, _context) {
    options.supported = { 'dynamic-import': false }
  },
})
