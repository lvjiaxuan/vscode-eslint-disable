import { type ExtensionContext, Position, SnippetString, type TextEditor, commands, window, workspace } from 'vscode'
import log from './log'
import type { ESLint } from 'eslint'
import { getTextBylines } from './utils'
import { workspacePath } from './global'
import { constructESLint } from './eslint'
import statusBarItem, { showStatusBarItem } from './statusBarItem'

let eslint: ESLint
const cache = new WeakMap<TextEditor, Record<number, string[]>>()

export async function activate(context: ExtensionContext) {
  const _startTime = Date.now()
  log('eslint-disabled activated!')

  const config = workspace.getConfiguration('eslint-disable')
  const disabled = config.get('disable', false)
  if (disabled) {
    log('eslint-disabled is disabled.')
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

  if (window.activeTextEditor) {
    void commands.executeCommand('eslint-disable.disableIT', true)
  }
  window.onDidChangeActiveTextEditor(editor => {
    // ...
    void commands.executeCommand('eslint-disable.disableIT', true)
  })

  log(`eslint-disabled initialized(${ Date.now() - _startTime }ms)!`)
  showStatusBarItem(`$(check) eslint-disabled initialized(${ Date.now() - _startTime }ms)!`)
}

// this method is called when your extension is deactivated
export function deactivate() {
  statusBarItem.value.dispose()
}

const disposes = [

  // disable lines
  commands.registerCommand('eslint-disable.disableIT', async (silent = false) => {

    const activeTextEditor = window.activeTextEditor
    if (!activeTextEditor) {
      return
    }

    if (activeTextEditor.selections.length > 1) {
      log('Sorry, we can not disable multi-selections for now. it will be supported in later version.', true, 'OK')
      return
    }

    if (!eslint) {
      log('ESLint library is pending. Try again later.')
      return
    }

    let lineRuleIdsMap = cache.get(activeTextEditor)
    console.log(lineRuleIdsMap)
    if (!lineRuleIdsMap) {

      log('Start linting hole file content...')
      showStatusBarItem('$(loading~spin) Start linting hole file content...', 0)

      // FIXME: A workaround.
      await new Promise<void>(resolve => setTimeout(() => setTimeout(resolve)))
      const _startTime = Date.now()
      const results = await eslint.lintFiles(activeTextEditor.document.uri.fsPath) // 经调试，实际上是同步代码，所以导致 `statusBarItem.show` 无法立即渲染显示

      log(`Linting finish(${ Date.now() - _startTime }ms).`)
      showStatusBarItem(`$(check) Linting finish(${ Date.now() - _startTime }ms).`)

      // eslint-disable-next-line require-atomic-updates
      lineRuleIdsMap = results?.[0].messages.reduce((preValue, item) => {
        if (!item.ruleId) return preValue
        if (!preValue[item.line]) {
          preValue[item.line] = [ item.ruleId ]
        } else {
          preValue[item.line] = [ ...preValue[item.line], item.ruleId ]
        }
        return preValue
      }, {} as Record<number, string[]>) ?? {}
      cache.set(activeTextEditor, lineRuleIdsMap)
    } else {
      // find cache lineRuleIdsMap
      log('Cache found.')
      showStatusBarItem('Cache found.')
    }


    if (!Object.keys(lineRuleIdsMap).length) {
      log('Everything is good.', !silent, 'OK')
      return
    }

    !silent && activeTextEditor.selections.forEach(selection => {

      const text = getTextBylines(selection.start.line, selection.end.line)
      if (!text?.replace(/\n|\r/g, '')) {
        log('No content to disable.', true, 'OK')
        return
      }

      if (!Object.keys(lineRuleIdsMap!).some(problemLine =>
        selection.start.line + 1 <= +problemLine && +problemLine <= selection.end.line + 1)) {
        log('No problem rules found on your selection.', true, 'OK')
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
      } else {
        // Wrap lines. Press `ctrl+d `to edit rules at between lines.

        const ruleIDSet = new Set<string>()
        for (const line in lineRuleIdsMap) {
          if (selection.start.line + 1 <= +line && +line <= selection.end.line + 1) {
            lineRuleIdsMap[+line].forEach(item => ruleIDSet.add(item))
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
    log('Reloading finished.')
    showStatusBarItem('$(check) Reloading finished.')
  }),
]
