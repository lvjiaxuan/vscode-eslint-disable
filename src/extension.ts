import { type ExtensionContext, Position, SnippetString, commands, window, workspace } from 'vscode'
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

  disposes.forEach(dispose => context.subscriptions.push(dispose))
}

// this method is called when your extension is deactivated
export function deactivate() {
  //
}

const disposes = [

  // hello world
  commands.registerCommand('eslint-disable.helloWorld', () => {
    void window.showInformationMessage('Hello World from eslint-disable!!!')
  }),

  // disable lines
  commands.registerCommand('eslint-disable.disableIT', async () => {

    const activeTextEditor = window.activeTextEditor
    if (!activeTextEditor || !eslint) {
      log('hold on...')
      return
    }

    log('Start linting...')
    // todo spinning on status bar
    const results = await eslint.lintFiles(activeTextEditor.document.uri.fsPath)
    log('Linting finish...')
    const lineRuleIdsMap = results?.[0].messages.reduce((preValue, item) => {
      if (!item.ruleId) return preValue
      if (!preValue[item.line]) {
        preValue[item.line] = [ item.ruleId ]
      } else {
        preValue[item.line] = [ ...preValue[item.line], item.ruleId ]
      }
      return preValue
    }, {} as Record<number, string[]>) ?? {}

    if (!Object.keys(lineRuleIdsMap).length) {
      log('Everything is good.')
      return
    }

    activeTextEditor.selections.forEach(selection => {

      const text = getTextBylines(selection.start.line, selection.end.line)
      if (!text) return

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
]

