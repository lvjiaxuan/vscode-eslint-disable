import fs from 'node:fs'
import vscode from 'vscode'
import { getBlockComment, getLineComment } from './languageDefaults'
import log from './log'

export function getTextBylines(startLine: number, endLine?: number) {
  return vscode.window.activeTextEditor?.document.getText(
    new vscode.Range(
      startLine,
      0,
      endLine ?? startLine,
      Number.MAX_VALUE,
    ),
  )
}

export function existFileSync(path: string) {
  try {
    fs.statSync(path)
    return true
  }
  catch {}
  return false
}

/**
 * use to single line.
 */
export function isDisablingComment(text: string, languageId: string) {
  const blockLike = `${getBlockComment(languageId)[0]} eslint-disable`
  const lineLike = `${getLineComment(languageId)} eslint-disable`

  if (text.startsWith(blockLike) || text.startsWith(lineLike)) {
    log('The selected line is a disabling comment.')
    return true
  }

  return false
}
