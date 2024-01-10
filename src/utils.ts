import fs from 'node:fs'
import vscode from 'vscode'

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
