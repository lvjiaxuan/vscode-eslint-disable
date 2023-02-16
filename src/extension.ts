import { type ExtensionContext, Position, SnippetString, commands, window, workspace } from 'vscode'
import type { ESLint } from 'eslint'
import { existFile, getTextBylines } from './utils'
import { workspacePath } from './global'
import { constructESLint } from './eslint'
import statusBarItem, { showStatusBarItem } from './statusBarItem'
import log from './log'
import config from './configuration'
import path from 'node:path'

let eslint: ESLint
const lintingCache = new Map<string, Record<number, string[]>>()
const filesBusy = new Map<string, boolean>()

export async function activate(context: ExtensionContext) {
  const _startTime = Date.now()
  log('eslint-disable is activating!')

  if (config.disable) {
    log('eslint-disable is disable.')
    return
  }

  if (!workspacePath) {
    log('No `workspacePath` found.')
    return
  }

  eslint = await constructESLint({
    overrideConfig: {
      overrides: [
        {
          files: [ '*.ts', '*.d.ts', '*.tsx', '*.vue' ],
          parserOptions: { tsconfigRootDir: workspacePath },
        },
      ],
    },
  })

  context.subscriptions.push(...disposes, statusBarItem.value)

  log(`eslint-disable is activated!(${ Date.now() - _startTime }ms)!`)
  showStatusBarItem(`$(check) eslint-disable is activated!(${ Date.now() - _startTime }ms)!`)

  log(`Pre-Linting is ${ config.preLinting ? 'enable' : 'disable' }.`)
  if (config.preLinting) {
    window.activeTextEditor && void commands.executeCommand('eslint-disable.disable', true)
    window.onDidChangeActiveTextEditor(() => window.activeTextEditor && commands.executeCommand('eslint-disable.disable', true))

    let timer: NodeJS.Timeout
    workspace.onDidChangeTextDocument(async event => {
      const fileName = event.document.fileName

      if (!await existFile(event.document.fileName) || !event.contentChanges.length) {
        return
      }

      /**
       * It seems that inserting `// eslint-disable` is no need to clear cache.
       * But in actually, the line numbers on cache would be changed.
       * Maybe I should re-compute these line numbers in later.
       */
      if (lintingCache.has(fileName)) {
        lintingCache.delete(fileName)
        log(`${ path.basename(fileName) } - Clear linting cache. Re-Linting after 5s.`)
        clearTimeout(timer)
        timer = setTimeout(() => void commands.executeCommand('eslint-disable.disable', true), 5 * 1000)
      }
    })
  }
}

// this method is called when your extension is deactivated
export function deactivate() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  disposes.forEach(fn => fn.dispose())
  statusBarItem.value.dispose()
}

const disposes = [

  // disable lines
  commands.registerCommand('eslint-disable.disable', async (silent = false) => {
    const activeTextEditor = window.activeTextEditor!

    const fileName = activeTextEditor.document.fileName
    const basename = path.basename(fileName)

    if (!await existFile(fileName)) {
      return
    }

    if (activeTextEditor.selections.length > 1) {
      log('Sorry, we can not disable multi-selections for now. It will be supported in later version.', true, 'OK')
      return
    }

    if (filesBusy.get(fileName)) {
      // Using keyboard shortcut, commands execute in serial.
      // Under onDidChangeTextDocument, commands execute in parallel.
      return
    }
    filesBusy.set(fileName, true)

    log('👇👇👇👇👇👇')
    log(`eslint-disable services ${ fileName }`)

    let lineRuleIdsMap = lintingCache.get(fileName)
    if (!lineRuleIdsMap) {

      log(`${ basename } - Start linting file text...`)
      showStatusBarItem('$(loading~spin) Start linting file text...', 0)

      // FIXME: A workaround.
      await new Promise<void>(resolve => setTimeout(() => setTimeout(resolve)))
      const _startTime = Date.now()
      const results = await eslint.lintFiles(activeTextEditor.document.uri.fsPath) // By debugging, it is a sync task，which makes `statusBarItem.show` cloud not render immediately.

      log(`${ basename } - Linting finish(${ Date.now() - _startTime }ms).`)
      showStatusBarItem(`$(check) Linting finish(${ Date.now() - _startTime }ms).`)

      // eslint-disable-next-line require-atomic-updates
      lineRuleIdsMap = results?.[0].messages.reduce((preValue, item) => {
        if (!item.ruleId) return preValue
        if (!preValue[item.line]) {
          preValue[item.line] = [ item.ruleId ]
        } else {
          preValue[item.line] = [ ...new Set([ ...preValue[item.line], item.ruleId ]) ]
        }
        return preValue
      }, {} as Record<number, string[]>) ?? {}

      if (config.preLinting) {
        lintingCache.set(fileName, lineRuleIdsMap)
        log(`${ basename } - Set linting cache.`)
      }
    } else {
      const parseFileName = path.parse(fileName).base
      log(`${ basename } - Linting cache found.`)
      showStatusBarItem(`Linting cache found at ${ parseFileName }.`)
    }
    filesBusy.set(fileName, false)


    if (lineRuleIdsMap && !Object.keys(lineRuleIdsMap).length) {
      log(`${ basename } - Everything is good.`, !silent, 'OK')
      return
    } else {
      log(`${ basename } - Problems found: ${ Object.values(lineRuleIdsMap).toString() } `)
    }

    !silent && activeTextEditor.selections.forEach(selection => {

      const text = getTextBylines(selection.start.line, selection.end.line)
      if (!text?.replace(/\n|\r/g, '')) {
        log(`${ basename } - No content to disable.`, true, 'OK')
        return
      }

      if (!Object.keys(lineRuleIdsMap!).some(problemLine =>
        selection.start.line + 1 <= +problemLine && +problemLine <= selection.end.line + 1)) {
        log(`${ basename } - No problem rules found from your selection.`, true, 'OK')
        return
      }

      let insertIndex = 0
      while (text.charAt(insertIndex) == ' ') {
        insertIndex++
      }

      if (selection.isSingleLine) {
        // Insert at previous line.
        void activeTextEditor.insertSnippet(
          new SnippetString(`// eslint-disable-next-line \${1|${ lineRuleIdsMap![selection.start.line + 1].join('\\, ') }|}\n`),
          new Position(selection.start.line, insertIndex),
        )
        delete lineRuleIdsMap![selection.start.line + 1]
      } else {
        // Wrap lines. Press `ctrl+d `to edit rules at between lines.

        const ruleIDSet = new Set<string>()
        for (const line in lineRuleIdsMap) {
          if (selection.start.line + 1 <= +line && +line <= selection.end.line + 1) {
            lineRuleIdsMap[+line].forEach(item => ruleIDSet.add(item))
            delete lineRuleIdsMap[+line]
          }
        }

        void activeTextEditor.insertSnippet(
          new SnippetString(`/* eslint-disable \${1|${ [ ...ruleIDSet ].join('\\, ') }|} */\n`),
          new Position(selection.start.line, insertIndex),
        )
        void activeTextEditor.insertSnippet(
          new SnippetString(`${ ' '.repeat(insertIndex) }/* eslint-enable \${1|${ [ ...ruleIDSet ].join('\\, ') }|} */\n`),
          new Position(selection.end.line + 2, 0),
        )
      }
    })
  }),

  // reload
  commands.registerCommand('eslint-disable.reload', async () => {
    log('Reloading eslint-disable.')
    showStatusBarItem('$(loading~spin) Reloading eslint-disable.', 0)
    eslint = await constructESLint({
      overrideConfig: {
        overrides: [
          {
            files: [ '*.ts', '*.d.ts', '*.tsx', '*.vue' ],
            parserOptions: { tsconfigRootDir: workspacePath },
          },
        ],
      },
    })
    lintingCache.clear()
    log('Reloading finished.')
    showStatusBarItem('$(check) Reloading finished.')
  }),
]
