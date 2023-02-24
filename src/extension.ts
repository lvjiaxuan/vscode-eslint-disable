import { type ExtensionContext, Position, Range, type Selection, SnippetString, type TextEditor, commands, window, workspace } from 'vscode'
import type { ESLint, Linter } from 'eslint'
import { existFile, getTextBylines } from './utils'
import { workspacePath } from './global'
import { getESLintInstance, getESLintLinterInstance } from './eslint'
import statusBarItem, { showStatusBarItem } from './statusBarItem'
import log from './log'
import config from './configuration'
import path from 'node:path'

let eslint: ESLint
// let linter: Linter
const lintingCache = new Map<string, Record<number, string[]>>()
let reLintingTimer: NodeJS.Timeout

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

  eslint = await getESLintInstance({
    overrideConfig: {
      overrides: [
        {
          files: [ '*.ts', '*.d.ts', '*.tsx', '*.vue' ],
          parserOptions: { tsconfigRootDir: workspacePath },
        },
      ],
    },
  })

  // linter = await getESLintLinterInstance()

  context.subscriptions.push(...disposes, statusBarItem.value)

  log(`eslint-disable is activated!(${ Date.now() - _startTime }ms)!`)
  showStatusBarItem(`$(check) eslint-disable is activated!(${ Date.now() - _startTime }ms)!`)

  log(`Pre-Linting is ${ config.preLinting ? 'enable' : 'disable' }.`)
  if (config.preLinting) {
    window.activeTextEditor && void commands.executeCommand('eslint-disable.disable', true)
    window.onDidChangeActiveTextEditor(() => window.activeTextEditor && commands.executeCommand('eslint-disable.disable', true))
    workspace.onDidChangeTextDocument(async event => {
      const fileName = event.document.fileName

      if (!await existFile(event.document.fileName) || !event.contentChanges.length) {
        return
      }

      /**
       * It seems that inserting `// eslint-disable` is no need to clear cache.
       * But in actually, the line numbers in cache would be changed.
       * Maybe I should re-compute these line numbers in later.
       */
      if (lintingCache.has(fileName)) {
        lintingCache.delete(fileName)
        log(`${ path.basename(fileName) } - Clear linting cache. Re-Linting after 5s.`)
        clearTimeout(reLintingTimer)
        reLintingTimer = setTimeout(() => void commands.executeCommand('eslint-disable.disable', true), 5 * 1000)
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

  // Disable for lines
  commands.registerCommand('eslint-disable.disable', (silent = false) => {
    clearTimeout(reLintingTimer)

    void disable(silent as boolean, ({ text, activeTextEditor, selection, lineRuleIdsMap }) => {
      let insertIndex = 0
      while (text.charAt(insertIndex) == ' ') {
        insertIndex++
      }

      if (selection.isSingleLine) {
        // Insert at previous line.
        void activeTextEditor.insertSnippet(
          new SnippetString(`// eslint-disable-next-line \${1|${ lineRuleIdsMap[selection.start.line + 1].join('\\, ') }|}\n`),
          new Position(selection.start.line, insertIndex),
        )
        delete lineRuleIdsMap[selection.start.line + 1]
      } else {
        // Wrap lines. Press `ctrl+d` to edit rules at between lines.

        const ruleIDSet = new Set<string>()
        for (const line in lineRuleIdsMap) {
          if (selection.start.line + 1 <= +line && +line <= selection.end.line + 1) {
            lineRuleIdsMap[+line].forEach(item => ruleIDSet.add(item))
            delete lineRuleIdsMap[+line]
          }
        }

        void (async () => {
          await activeTextEditor.insertSnippet(
            new SnippetString(`/* eslint-disable \${1|${ [ ...ruleIDSet ].join('\\, ') }|} */\n`),
            new Position(selection.start.line, insertIndex),
          )
          await activeTextEditor.insertSnippet(
            new SnippetString(`${ ' '.repeat(insertIndex) }/* eslint-enable \${1|${ [ ...ruleIDSet ].join('\\, ') }|} */\n`),
            new Position(selection.end.line + 2, 0),
          )
        })()
      }
    })
  }),

  // Disable for entire
  commands.registerCommand('eslint-disable.entire', () => {
    // keep
    const startLineText = getTextBylines(0)
    const endLineText = window.activeTextEditor ? getTextBylines(window.activeTextEditor.document.lineCount - 2) : ''
    const match = startLineText?.match(/\/\* eslint-disable (?<rules>.+) \*\//i)

    void disable(false, async ({ selection, activeTextEditor, lineRuleIdsMap }) => {

      let selectRules: string[] = []
      if (selection.isSingleLine) {
        selectRules = lineRuleIdsMap[selection.start.line + 1]
        delete lineRuleIdsMap[selection.start.line + 1]
      } else {
        const ruleIDSet = new Set<string>()
        for (const line in lineRuleIdsMap) {
          if (selection.start.line + 1 <= +line && +line <= selection.end.line + 1) {
            lineRuleIdsMap[+line].forEach(item => ruleIDSet.add(item))
            delete lineRuleIdsMap[+line]
          }
        }
        selectRules = [ ...ruleIDSet ]
      }

      if (match) {
        const entireRules = match?.groups!.rules.replaceAll(' ', '').split(',') ?? []
        const rules = [ ...new Set([ ...selectRules, ...entireRules ]) ]


        await activeTextEditor.edit(editor => {
          editor.delete(new Range(
            new Position(0, 0),
            new Position(0, Number.MAX_SAFE_INTEGER),
          ))

          if (endLineText?.startsWith('/* eslint-enable')) {
            editor.delete(new Range(
              new Position(activeTextEditor.document.lineCount - 2, 0),
              new Position(activeTextEditor.document.lineCount - 2, Number.MAX_SAFE_INTEGER),
            ))
          }
        })

        await activeTextEditor.insertSnippet(
          new SnippetString(`/* eslint-enable ${ rules.join(', ') } */`),
          new Position(activeTextEditor.document.lineCount - 2, 0),
        )
        await activeTextEditor.insertSnippet(
          new SnippetString(`/* eslint-disable ${ rules.join(', ') } */`),
          new Position(0, 0),
        )

      } else {
        await activeTextEditor.insertSnippet(
          new SnippetString(`/* eslint-enable ${ selectRules.join(', ') } */\n`),
          new Position(activeTextEditor.document.lineCount + 1, 0),
        )
        await activeTextEditor.insertSnippet(
          new SnippetString(`/* eslint-disable ${ selectRules.join(', ') } */\n`),
          new Position(0, 0),
        )
      }
    })
  }),

  // Reload
  commands.registerCommand('eslint-disable.reload', async () => {
    log('Reloading eslint-disable.')
    showStatusBarItem('$(loading~spin) Reloading eslint-disable.', 0)
    eslint = await getESLintInstance({
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

const filesBusy = new Map<string, boolean>()
async function disable(silent: boolean, insert: (opts: {
  text: string,
  activeTextEditor: TextEditor,
  selection: Selection,
  lineRuleIdsMap: NonNullable<ReturnType<(typeof lintingCache)['get']>>
}) => void) {
  const activeTextEditor = window.activeTextEditor!

  const fileName = activeTextEditor.document.fileName
  const basename = path.basename(fileName)

  if (!await existFile(fileName)) {
    return false
  }

  if (activeTextEditor.selections.length > 1) {
    log('Sorry, we can not disable multi-selections for now. It will be supported in later version.', true, 'OK')
    return false
  }

  if (filesBusy.get(fileName)) {
    // Command would not await last command task, which execute in parallel.
    return false
  }
  filesBusy.set(fileName, true)

  log('')
  log('👇👇👇👇👇👇')
  log(`eslint-disable services ${ fileName }`)

  let lineRuleIdsMap = lintingCache.get(fileName)
  if (!lineRuleIdsMap) {

    log(`${ basename } - Linting ${ basename } content...`)
    showStatusBarItem(`$(loading~spin) Linting ${ basename } content...`, 0)

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
    return false
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

    insert({ text, activeTextEditor, selection, lineRuleIdsMap: lineRuleIdsMap! })
  })

  return { activeTextEditor, basename, lineRuleIdsMap }
}
