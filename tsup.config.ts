import { defineConfig } from 'tsup'
import fs from 'fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export default defineConfig({
  esbuildPlugins: [
    // {
    //   name: 'espree-plugin',
    //   setup(build) {
    //     build.onLoad({ filter: /rule-tester.js/ }, async args => {

    //       let contents = await fs.promises.readFile(args.path, 'utf8')

    //       contents = contents.replace(
    //         'const espreePath = require.resolve("espree");',
    //         `const espreePath = "${ require.resolve('espree') }";`,
    //       )

    //       return { contents, loader: 'js' }
    //     })
    //   },
    // },
  ],
})
