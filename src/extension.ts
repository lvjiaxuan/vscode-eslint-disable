import { ExtensionContext, Position, Range, Selection, SnippetString, TextEditorRevealType, commands, languages, window } from 'vscode'
import { existFileSync, getTextBylines } from './utils'
import { blockCommentRegex, getBlockComment, getLineComment } from './languageDefaults'
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

  const blockComment = getBlockComment(activeTextEditor.document.languageId)

  // TODO Maybe not 0 line.
  const startLineText = getTextBylines(0)
  const startLineTextMatch = startLineText?.trim().match(
    new RegExp(`${ blockCommentRegex[blockComment[0]] ?? blockComment[0] }\\s*eslint-disable\\s+(?<rules>.+)\\s*${ blockCommentRegex[blockComment[1]] ?? blockComment[1] }`, 'i'),
  )

  const endLineWithText = (function finEndLineText(line = activeTextEditor.document.lineCount): { text: string, line: number } {
    const text = getTextBylines(line - 1)?.trim()
    if (!text) {
      return finEndLineText(line - 1)
    }
    return { text, line }
  }())


  const isEndLineHasText = endLineWithText.line === activeTextEditor.document.lineCount
  const isEndCommentMatch = endLineWithText.text.trim().match(
    new RegExp(`${ blockCommentRegex[blockComment[0]] ?? blockComment[0] }\\s*eslint-enable.*?${ blockCommentRegex[blockComment[1]] ?? blockComment[1] }`, 'i'),
  )

  if (startLineTextMatch) {
    const currentRules = startLineTextMatch?.groups!.rules.replaceAll(' ', '').split(',') ?? []
    currentRules.forEach(item => insertRules.add(item))

    /**
     * howToInsertEndComments
     *
     * 1. 尾行有值，但不是end comment：新起一行，尾带换行
     * 2. 尾行有值，且是end comment：删除，然后替换当前行，换行
     * 3. 尾行无值，最近有值尾行不是end comment：直接插入，尾带换行
     * 4. 尾行无值，最近有值尾行是end comment：删除，然后替换当前行
     */

    // Delete existing comments.
    await activeTextEditor.edit(editor => {
      editor.delete(new Range(
        new Position(0, 0),
        new Position(0, Number.MAX_VALUE),
      ))

      if (isEndCommentMatch) {
        editor.delete(new Range(
          new Position(endLineWithText.line - 1, 0),
          new Position(endLineWithText.line - 1, Number.MAX_VALUE),
        ))
      }
    })

    const sorted = [ ...insertRules ].sort((a, b) => a > b ? 1 : -1)

    let snippetString: string
    let insertLine: number
    if (isEndLineHasText && !isEndCommentMatch) {
      snippetString = `\n${ blockComment[0] } eslint-enable ${ sorted.join(', ') } ${ blockComment[1] }\n`
      insertLine = activeTextEditor.document.lineCount
    } else if (isEndLineHasText && isEndCommentMatch) {
      snippetString = `${ blockComment[0] } eslint-enable ${ sorted.join(', ') } ${ blockComment[1] }\n`
      insertLine = endLineWithText.line
    } else if (!isEndCommentMatch) {
      snippetString = `${ blockComment[0] } eslint-enable ${ sorted.join(', ') } ${ blockComment[1] }\n`
      insertLine = activeTextEditor.document.lineCount
    } else {
      snippetString = `${ blockComment[0] } eslint-enable ${ sorted.join(', ') } ${ blockComment[1] }`
      insertLine = endLineWithText.line - 1
    }

    await activeTextEditor.insertSnippet(
      new SnippetString(snippetString!),
      new Position(insertLine!, 0),
    )
    await activeTextEditor.insertSnippet(
      new SnippetString(`${ blockComment[0] } eslint-disable ${ sorted.join(', ') } ${ blockComment[1] }`),
      new Position(0, 0),
    )
  } else {
    const sorted = [ ...insertRules ].sort((a, b) => a > b ? 1 : -1)
    await activeTextEditor.insertSnippet(
      new SnippetString(`${ isEndLineHasText && !isEndCommentMatch ? '\n' : '' }${ blockComment[0] } eslint-enable ${ sorted.join(', ') } ${ blockComment[1] }\n`),
      new Position(activeTextEditor.document.lineCount + 1, 0),
    )
    await activeTextEditor.insertSnippet(
      new SnippetString(`${ blockComment[0] } eslint-disable ${ sorted.join(', ') } ${ blockComment[1] }\n`),
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
