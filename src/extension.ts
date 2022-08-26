import { type ExtensionContext, Position, SnippetString, commands, window, workspace } from 'vscode'
import log from './log'
// import { ESLint } from 'eslint'
import { getTextBylines } from './utils'

export function activate(context: ExtensionContext) {

  log.appendLine('eslint-disabled activated!')
  console.log('eslint-disabled activated!')

  disposes.forEach(dispose => context.subscriptions.push(dispose))
}

// this method is called when your extension is deactivated
export function deactivate() {
  // ...
}


const disposes = [

  // hello world
  commands.registerCommand('eslint-disable.helloWorld', () => {

    void window.showInformationMessage('Hello World from eslint-disable!!!')
    // const eslint = new ESLint()
  }),

  // disable lines
  commands.registerCommand('eslint-disable.disableIT', () => {

    const activeTextEditor = window.activeTextEditor
    if (!activeTextEditor) {
      console.log('hold on...')
      return
    }

    activeTextEditor.selections.forEach(selection => {

      const text = getTextBylines(selection.start.line, selection.end.line)
      let insertIndex = 0
      while (text!.charAt(insertIndex) == ' ') {
        insertIndex++
      }

      if (selection.isSingleLine) {
        // insert at previous line.
        void activeTextEditor.insertSnippet(
          new SnippetString('// eslint-disable-next-line ${1|INSERT_RULES|}\n'),
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
