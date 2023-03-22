import { ExtensionContext, Position, Range, Selection, SnippetString, TextEditorRevealType, commands, languages, window } from 'vscode'
import { existFileSync, getTextBylines } from './utils'
import { getBlockComment, getExtension, getLineComment } from './languageDefaults'
import log from './log'
import path from 'node:path'

export function activate(context: ExtensionContext) {

  context.subscriptions.push(disableForLines)
  context.subscriptions.push(disableForFile)
  context.subscriptions.push(disableAllForFile)
}

export function deactivate() {
  disableForLines.dispose()
  disableForFile.dispose()
  disableAllForFile.dispose()
}

const disableForLines = commands.registerCommand('eslint-disable.disable', () => {
  const result = getESLintDiagnostics()
  if (!result) {
    return
  }

  const { text, selection, activeTextEditor, eslintDiagnostics, selectionDiagnostics } = result

  let insertIndex = 0
  while (text.charAt(insertIndex) == ' ') {
    insertIndex++
  }

  // @ts-ignore
  const insertRules = new Set(selectionDiagnostics.map(item => item.code.value as string))

  const lineComment = getLineComment(activeTextEditor.document.languageId)
  const blockComment = getBlockComment(activeTextEditor.document.languageId)

  if (selection.isSingleLine) {
    // Insert at previous line.
    void activeTextEditor.insertSnippet(
      new SnippetString(`${ lineComment } eslint-disable-next-line \${1:${ [ ...insertRules ].join(', ') }}\n`),
      new Position(selection.anchor.line, insertIndex),
    )
  } else {
    // Wrap lines and Press `ctrl+d` to edit rules between lines.

    void (async () => {
      await activeTextEditor.insertSnippet(
        new SnippetString(`${ ' '.repeat(insertIndex) }${ blockComment[0] } eslint-enable ${ [ ...insertRules ].join(', ') } ${ blockComment[1] }\n`),
        new Position(selection.end.line + 1, 0),
      )
      await activeTextEditor.insertSnippet(
        new SnippetString(`${ blockComment[0] } eslint-disable \${1:${ [ ...insertRules ].join(', ') }} ${ blockComment[1] }\n`),
        new Position(selection.start.line, insertIndex),
      )
    })()
  }
})

const disableForFile = commands.registerCommand('eslint-disable.entire', async (allRules: false) => {
  const result = getESLintDiagnostics(allRules)
  if (!result) {
    return
  }

  const { selection, activeTextEditor, eslintDiagnostics, selectionDiagnostics } = result

  // @ts-ignore
  const insertRules = new Set((allRules ? eslintDiagnostics : selectionDiagnostics).map(item => item.code.value as string))

  // TODO Maybe not 0 line.
  const startLineText = getTextBylines(0)
  const startLineTextMatch = startLineText?.match(/\/\* eslint-disable (?<rules>.+) \*\//i)

  const blockComment = getBlockComment(activeTextEditor.document.languageId)

  if (startLineTextMatch) {
    const currentRules = startLineTextMatch?.groups!.rules.replaceAll(' ', '').split(',') ?? []
    currentRules.forEach(item => insertRules.add(item))

    // Delete exist comments.
    await activeTextEditor.edit(editor => {

      editor.delete(new Range(
        new Position(0, 0),
        new Position(0, Number.MAX_VALUE),
      ))

      const endLineText = getTextBylines(activeTextEditor.document.lineCount - 2)
      if (endLineText?.startsWith(`${ blockComment[0] } eslint-enable`)) {
        editor.delete(new Range(
          new Position(activeTextEditor.document.lineCount - 2, 0),
          new Position(activeTextEditor.document.lineCount - 2, Number.MAX_VALUE),
        ))
      }
    })

    await activeTextEditor.insertSnippet(
      new SnippetString(`${ blockComment[0] } eslint-enable ${ [ ...insertRules ].join(', ') } ${ blockComment[1] }`),
      new Position(activeTextEditor.document.lineCount - 2, 0),
    )
    await activeTextEditor.insertSnippet(
      new SnippetString(`${ blockComment[0] } eslint-disable ${ [ ...insertRules ].join(', ') } ${ blockComment[1] }`),
      new Position(0, 0),
    )
  } else {
    await activeTextEditor.insertSnippet(
      new SnippetString(`${ blockComment[0] } eslint-enable ${ [ ...insertRules ].join(', ') } ${ blockComment[1] }\n`),
      new Position(activeTextEditor.document.lineCount + 1, 0),
    )
    await activeTextEditor.insertSnippet(
      new SnippetString(`${ blockComment[0] } eslint-disable ${ [ ...insertRules ].join(', ') } ${ blockComment[1] }\n`),
      new Position(0, 0),
    )
  }

  activeTextEditor.revealRange(
    new Range(new Position(selection.anchor.line, 0), new Position(selection.anchor.line, 0)),
    TextEditorRevealType.InCenterIfOutsideViewport,
  )

  activeTextEditor.selection = new Selection(
    new Position(selection.end.line + 1, Number.MAX_VALUE),
    new Position(selection.end.line + 1, Number.MAX_VALUE),
  )
})

const disableAllForFile = commands.registerCommand('eslint-disable.all', () => {
  // ...
  void commands.executeCommand('eslint-disable.entire', true)
})


function getESLintDiagnostics(allRules = false) {
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
  const selectionDiagnostics = eslintDiagnostics.filter(item =>
    selection.start.line <= item.range.start.line && item.range.start.line <= selection.end.line)

  if (allRules && !eslintDiagnostics.length) {
    log(`${ basename } - No problems found on this file.`, true, 'OK')
    return
  }

  if (!allRules && !selectionDiagnostics.length) {
    log(`${ basename } - No problems found on this selection.`, true, 'OK')
    return
  }

  return { text, selection, activeTextEditor, eslintDiagnostics, selectionDiagnostics }
}
