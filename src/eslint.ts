import log from './log'
import { Files } from 'vscode-languageserver/node'
import { workspacePath } from './global'
import { exec } from 'child_process'

type PKG_MANAGERS = { agent: 'pnpm' | 'npm' | 'yarn', path: string }
export const resolveESLintPath = () => Files.resolve('eslint', workspacePath, workspacePath, message => { /**/ })
  .catch(() => {
    log('Failed to resolve local ESLint. Try Globally.')
    return Promise.allSettled<PKG_MANAGERS>(
      [ 'pnpm root -g', 'npm root -g', 'yarn global dir' ].map(item =>
        new Promise((resolve, reject) =>
          exec(item, (error, stdout) => {
            if (error) {
              reject(error)
              return
            }
            resolve({
              agent: item.split(' ')[0] as 'pnpm' | 'npm' | 'yarn',
              path: stdout.toString().trim(),
            })
          }))),
    ).then(results => {
      const agent = results.filter(({ status }) => status === 'fulfilled')[0] as PromiseFulfilledResult<PKG_MANAGERS>

      return Files.resolve('eslint', agent.value.path, workspacePath, message => { /**/ })
    }).catch(() => log('Failed to resolve global ESLint. Please instal ESLint first.'))
  })
