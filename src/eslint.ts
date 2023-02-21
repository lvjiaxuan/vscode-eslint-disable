import log from './log'
import { Files } from 'vscode-languageserver/node'
import { workspacePath } from './global'
import { exec } from 'node:child_process'
import { ESLint, Linter } from 'eslint'
import path from 'node:path'

type PKG_MANAGERS = { agent: 'pnpm' | 'npm' | 'yarn', path: string }
const resolveESLintPath = () => Files.resolve('eslint', workspacePath, workspacePath, message => { /**/ })
  .catch(() => {
    log('Fail to resolve local ESLint. Trying globally...')
    return Promise.allSettled<PKG_MANAGERS>(
      [ 'pnpm root -g', 'npm root -g', 'yarn global dir' ].map(item =>
        new Promise((resolve, reject) =>
          exec(item, (error, stdout) => {
            if (error) {
              reject(error)
              return
            }
            resolve({
              agent: item.split(' ')[0] as PKG_MANAGERS['agent'],
              path: stdout.toString().trim(),
            })
          }))),
    )
  }).then(result => {

    if (typeof result === 'string') {
      return result
    }

    const agent = result.filter(({ status }) => status === 'fulfilled')[0] as PromiseFulfilledResult<PKG_MANAGERS>
    return Files.resolve('eslint', agent.value.path, workspacePath, message => { /**/ })
  }).catch(() => {
    log('Fail to resolve global ESLint. Please install ESLint first.')
    // eslint-disable-next-line promise/no-return-wrap
    return Promise.reject('Fail to resolve global ESLint. Please install ESLint first.')
  })

export const constructESLint = async (options?: ESLint.Options) => {
  const eslintPath = await resolveESLintPath()
  const eslintModule = await import(path.join(eslintPath)) as {
    ESLint: typeof ESLint
    Linter: typeof Linter
  }

  log(`ESLint library loaded from: ${ eslintPath }`)
  return new eslintModule.ESLint(options)
}

export const getESLintInstance = async (options?: ESLint.Options) => {
  const eslintPath = await resolveESLintPath()
  const eslintModule = await import(path.join(eslintPath)) as {
    ESLint: typeof ESLint
  }

  log(`ESLint library loaded from: ${ eslintPath }`)
  return new eslintModule.ESLint(options)
}

export const getESLintLinterInstance = async (options?: ESLint.Options) => {
  const eslintPath = await resolveESLintPath()
  const eslintModule = await import(path.join(eslintPath)) as {
    Linter: typeof Linter
  }

  log(`ESLint library loaded from: ${ eslintPath }`)
  return new eslintModule.Linter()
}
