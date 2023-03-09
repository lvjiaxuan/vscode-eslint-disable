import log from './log'
import { Files } from 'vscode-languageserver/node'
import { workspacePath } from './global'
import { exec } from 'node:child_process'
import { ESLint, Linter } from 'eslint'
import path from 'node:path'
import { type ExtensionContext } from 'vscode'
import { existFile } from './utils'
import config from './configuration'

const useFlatConfig = config.useFlatConfig

type PKG_MANAGERS = { agent: 'pnpm' | 'npm' | 'yarn', path: string }
const resolveESLintPath = () => Files.resolve(`eslint${ useFlatConfig ? '/use-at-your-own-risk' : '' }`, workspacePath, workspacePath, message => { /**/ })
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

export const getESLintInstance = async (context: ExtensionContext) => {
  let eslintPath = context.workspaceState.get<string>(useFlatConfig ? 'flatESLintPath' : 'eslintPath')
  if (eslintPath && await existFile(eslintPath)) {
    log(`${ useFlatConfig ? 'Flat ' : '' }ESLint path found from storage`)
  } else {
    eslintPath = await resolveESLintPath()
    void context.workspaceState.update('eslintPath', eslintPath)
  }

  const eslintModule = await import(path.join(eslintPath)) as {
    ESLint: typeof ESLint
    FlatESLint: typeof ESLint
  }

  log(`${ useFlatConfig ? 'Flat ' : '' }ESLint library loaded from: ${ eslintPath }`)
  return useFlatConfig
    ? new eslintModule.FlatESLint({
      cwd: workspacePath,
      overrideConfig: {
        // @ts-ignore
        files: [ '**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts' ],
        languageOptions: { parserOptions: { tsconfigRootDir: workspacePath } },
      },
    })
    : new eslintModule.ESLint({
      cwd: workspacePath,
      overrideConfig: {
        overrides: [
          {
            files: [ '*.ts', '*.d.ts', '*.tsx', '*.vue' ],
            parserOptions: { tsconfigRootDir: workspacePath },
          },
        ],
      },
    })
}

export const getESLintLinterInstance = async () => {
  const eslintPath = await resolveESLintPath()
  const eslintModule = await import(path.join(eslintPath)) as { Linter: typeof Linter }

  log(`ESLint library loaded from: ${ eslintPath }`)
  return new eslintModule.Linter()
}
