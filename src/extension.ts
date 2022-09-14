import { type ExtensionContext, Position, SnippetString, StatusBarAlignment, StatusBarItem, commands, window, workspace } from 'vscode'
import log from './log'
import type { ESLint } from 'eslint'
import { getTextBylines } from './utils'
import { workspacePath } from './global'
import { constructESLint } from './eslint'

let eslint: ESLint
let statusBarItem: StatusBarItem

export async function activate(context: ExtensionContext) {
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

  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)

  context.subscriptions.push(...disposes, statusBarItem)

  log('eslint-disabled initialized!')
}

// this method is called when your extension is deactivated
export function deactivate() {
  // ...
}

const disposes = [

  // disable lines
  commands.registerCommand('eslint-disable.disableIT', async () => {

    const activeTextEditor = window.activeTextEditor
    if (!activeTextEditor || !eslint) {
      log('no `activeTextEditor` exist.')
      return
    }

    if (activeTextEditor.selections.length > 1) {
      log('Sorry, we can not disable multi-lines for now. Support in later version.', true, 'OK')
      return
    }

    if (!eslint) {
      log('ESLint library is pending.')
      return
    }

    log('Start linting hole file content...')
    statusBarItem.text = '$(loading~spin) Start linting hole file content...'
    statusBarItem.show()

    const results = await eslint.lintFiles(activeTextEditor.document.uri.fsPath)

    log('Linting finish.')
    // eslint-disable-next-line require-atomic-updates
    statusBarItem.text = '$(check) Linting finish.'
    setTimeout(() => statusBarItem.hide(), 3000)

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
      log('Everything is good.', true, 'OK')
      return
    }

    activeTextEditor.selections.forEach(selection => {

      const text = getTextBylines(selection.start.line, selection.end.line)
      if (!text) {
        log('No content to disable.', true, 'OK')
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
        // Wrap lines. Press `ctrl+d `to edit rules at between lines.
        void activeTextEditor.insertSnippet(
          new SnippetString(`/* eslint-disable \${1|${ lineRuleIdsMap[selection.start.line + 1].join('\\, ') }|} */\n`),
          new Position(selection.start.line, insertIndex),
        )
        void activeTextEditor.insertSnippet(
          new SnippetString(`/* eslint-enable \${1|${ lineRuleIdsMap[selection.start.line + 1].join('\\, ') }|} */\n`),
          new Position(selection.end.line + 2, insertIndex),
        )
      }
    })

  }),

  // hello world
  commands.registerCommand('eslint-disable.helloWorld', () => {
    void window.showInformationMessage('Hello World from eslint-disable!!!')
  }),
]
