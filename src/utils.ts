import vscode from 'vscode'

export const getTextBylines = (startLine: number, endLine?: number) =>
  vscode.window.activeTextEditor?.document.getText(
    new vscode.Range(
      startLine, 0, endLine ?? startLine,
      Number.MAX_VALUE,
    ),
  )
