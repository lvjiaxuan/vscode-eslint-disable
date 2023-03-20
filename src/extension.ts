import { ExtensionContext, Position, Range, Selection, SnippetString, commands, languages, window } from 'vscode'
import { existFileSync, getTextBylines } from './utils'
import log from './log'
import path from 'node:path'

export function activate(context: ExtensionContext) {

  context.subscriptions.push(disableForLines)
  context.subscriptions.push(disableForEntire)
}

export function deactivate() {
  disableForLines.dispose()
  disableForEntire.dispose()
}

const disableForLines = commands.registerCommand('eslint-disable.disable', () => {
  const result = getESLintDiagnostics()
  if (!result) {
    return
  }

  const { text, selection, activeTextEditor, eslintDiagnostics } = result

  let insertIndex = 0
  while (text.charAt(insertIndex) == ' ') {
    insertIndex++
  }

  const insertRules = eslintDiagnostics.reduce((insertRules, item) => {
    const isRuleInLine = selection.isSingleLine
      ? item.range.start.line === selection.start.line
      : selection.start.line + 1 <= item.range.start.line && item.range.start.line <= selection.end.line + 1

    if (isRuleInLine) {
      // @ts-ignore
      insertRules.add(item.code.value as string)
    }
    return insertRules
  }, new Set<string>())

  if (selection.isSingleLine) {
    // Insert at previous line.
    void activeTextEditor.insertSnippet(
      new SnippetString(`// eslint-disable-next-line \${1:${ [ ...insertRules ].join(', ') }}\n`),
      new Position(selection.start.line, insertIndex),
    )
  } else {
    // Wrap lines and Press `ctrl+d` to edit rules between lines.

    void (async () => {
      await activeTextEditor.insertSnippet(
        new SnippetString(`${ ' '.repeat(insertIndex) }/* eslint-enable ${ [ ...insertRules ].join(', ') } */\n`),
        new Position(selection.end.line + 1, 0),
      )
      await activeTextEditor.insertSnippet(
        new SnippetString(`/* eslint-disable \${1:${ [ ...insertRules ].join(', ') }} */\n`),
        new Position(selection.start.line, insertIndex),
      )
    })()
  }
})

const disableForEntire = commands.registerCommand('eslint-disable.entire', async () => {
  const result = getESLintDiagnostics()
  if (!result) {
    return
  }

  const { text, selection, activeTextEditor, eslintDiagnostics } = result

  // @ts-ignore
  let insertRules: Set<string> = eslintDiagnostics.reduce((insertRules, item) => {

    const isRuleInLine = selection.isSingleLine
      ? item.range.start.line === selection.start.line
      : selection.start.line + 1 <= item.range.start.line && item.range.start.line <= selection.end.line + 1

    if (isRuleInLine) {
      // @ts-ignore
      insertRules.add(item.code.value as string)
    }
    return insertRules
  }, new Set<string>())

  // TODO Maybe not 0 line.
  const startLineText = getTextBylines(0)
  const startLineTextMatch = startLineText?.match(/\/\* eslint-disable (?<rules>.+) \*\//i)

  if (startLineTextMatch) {
    const currentRules = startLineTextMatch?.groups!.rules.replaceAll(' ', '').split(',') ?? []
    currentRules.forEach(item => insertRules.add(item))

    // Delete exist comments.
    await activeTextEditor.edit(editor => {

      editor.delete(new Range(
        new Position(0, 0),
        new Position(0, Number.MAX_SAFE_INTEGER),
      ))

      const endLineText = getTextBylines(activeTextEditor.document.lineCount - 2)
      if (endLineText?.startsWith('/* eslint-enable')) {
        editor.delete(new Range(
          new Position(activeTextEditor.document.lineCount - 2, 0),
          new Position(activeTextEditor.document.lineCount - 2, Number.MAX_SAFE_INTEGER),
        ))
      }
    })

    await activeTextEditor.insertSnippet(
      new SnippetString(`/* eslint-enable ${ [ ...insertRules ].join(', ') } */`),
      new Position(activeTextEditor.document.lineCount - 2, 0),
    )
    await activeTextEditor.insertSnippet(
      new SnippetString(`/* eslint-disable ${ [ ...insertRules ].join(', ') } */`),
      new Position(0, 0),
    )
  } else {
    await activeTextEditor.insertSnippet(
      new SnippetString(`/* eslint-enable ${ [ ...insertRules ].join(', ') } */\n`),
      new Position(activeTextEditor.document.lineCount + 1, 0),
    )
    await activeTextEditor.insertSnippet(
      new SnippetString(`/* eslint-disable ${ [ ...insertRules ].join(', ') } */\n`),
      new Position(0, 0),
    )
  }
})

function getESLintDiagnostics() {
  const { activeTextEditor } = window

  if (!activeTextEditor) {
    log('No activeTextEditor found, please try again.', true, 'OK')
    return
  }

  const { fileName } = activeTextEditor.document
  if (!existFileSync(fileName)) {
    log(`Not a exist file: ${ fileName }`)
    return
  }

  const uri = activeTextEditor.document.uri.toString()

  // activeTextEditor.selections would supported in later version.
  const { selection } = activeTextEditor
  const basename = path.basename(uri)

  const text = getTextBylines(selection.start.line, selection.end.line)
  if (!text?.replace(/\n|\r/g, '')) {
    log(`${ basename } - No content to disable.`, true, 'OK')
    return
  }

  const diagnostics = languages.getDiagnostics()
  const diagnosticOfUri = diagnostics.find(item => item[0].toString() === uri)
  const eslintDiagnostics = diagnosticOfUri?.[1].filter(item => item.source === 'eslint') ?? []
  if (!eslintDiagnostics.length) {
    log(`${ basename } - No problem found on your selection.`, true, 'OK')
    return
  }

  return { text, selection, activeTextEditor, eslintDiagnostics }
}
