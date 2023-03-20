import vscode from 'vscode'
import fs from 'fs'

export const getTextBylines = (startLine: number, endLine?: number) =>
  vscode.window.activeTextEditor?.document.getText(
    new vscode.Range(
      startLine, 0, endLine ?? startLine,
      Number.MAX_VALUE,
    ),
  )

export function existFileSync(path: string) {
  try {
    fs.statSync(path)
    return true
  } catch {}
  return false
}
