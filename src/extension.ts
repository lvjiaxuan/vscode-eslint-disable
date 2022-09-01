import { type ExtensionContext, Position, ProgressLocation, SnippetString, TextEdit, TextEditor, commands, window, workspace } from 'vscode'
import log from './log'
import { ESLint } from 'eslint'
import { getTextBylines } from './utils'


let eslint: ESLint | null

export function activate(context: ExtensionContext) {

  log('eslint-disabled activated!')

  eslint = new ESLint({
    overrideConfig: {
      overrides: [
        {
          files: [ '*.ts', '*.d.ts', '*.tsx', '*.vue' ],
          parserOptions: { tsconfigRootDir: workspace.workspaceFolders?.[0].uri.fsPath },
        },
      ],
    },
  })

  context.subscriptions.push(...disposes)
}

// this method is called when your extension is deactivated
export function deactivate() {
  //
}

const disposes = [

  // disable lines
  commands.registerCommand('eslint-disable.disableIT', async () => {

    const activeTextEditor = window.activeTextEditor
    if (!activeTextEditor || !eslint) {
      log('no `activeTextEditor` exist.', true)
      return
    }

    const lineRuleIdsMap = await window.withProgress({
      cancellable: false,
      location: ProgressLocation.Notification,
      title: 'Progress Notification',
    }, async (progress, token) => {

      log('Start linting hole file content...')
      let count = 5
      progress.report({ increment: 5, message: 'Start linting hole file content...' })

      const fakeIncrement = setInterval(() => {
        progress.report({ increment: count++, message: 'Still going...' })
        if (count == 95) clearInterval(fakeIncrement)
      }, 1000)

      const results = await eslint!.lintFiles(activeTextEditor.document.uri.fsPath)

      log('Linting finish...')
      clearInterval(fakeIncrement)
      progress.report({ increment: 99, message: 'Linting finish.' })

      const lineRuleIdsMap = results?.[0].messages.reduce((preValue, item) => {
        if (!item.ruleId) return preValue
        if (!preValue[item.line]) {
          preValue[item.line] = [ item.ruleId ]
        } else {
          preValue[item.line] = [ ...preValue[item.line], item.ruleId ]
        }
        return preValue
      }, {} as Record<number, string[]>) ?? {}

      // eslint-disable-next-line no-promise-executor-return
      return new Promise<typeof lineRuleIdsMap>(resolve => setTimeout(() => resolve(lineRuleIdsMap), 500))
    })

    if (!Object.keys(lineRuleIdsMap).length) {
      log('Everything is good.')
      void window.showInformationMessage('Everything is good.', 'OK')
      return
    }

    activeTextEditor.selections.forEach(selection => {

      const text = getTextBylines(selection.start.line, selection.end.line)
      if (!text) {
        void window.showInformationMessage('No content to disable.', 'OK')
        return
      }

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
      } else {
      // wrap lines. Press `ctrl+d `to edit rules.
        void activeTextEditor.insertSnippet(
          new SnippetString('/* eslint-disable ${1|INSERT_RULES|} */\n'),
          new Position(selection.start.line, insertIndex),
        )
        void activeTextEditor.insertSnippet(
          new SnippetString('/* eslint-enable ${1|INSERT_RULES|} */\n'),
          new Position(selection.end.line + 2, insertIndex),
        )
      }
    })

  }),

  // hello world
  commands.registerCommand('eslint-disable.helloWorld', () => {
    const p = window.showInformationMessage('Hello World from eslint-disable!!!')
    void p.then(r => {
      return r
    })
    // ...
  }),
]

