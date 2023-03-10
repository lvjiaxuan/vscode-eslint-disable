import vscode from 'vscode'
import fs from 'fs'

export const getTextBylines = (startLine: number, endLine?: number) =>
  vscode.window.activeTextEditor?.document.getText(
    new vscode.Range(
      startLine, 0, endLine ?? startLine,
      Number.MAX_VALUE,
    ),
  )

export function existFile(file: string): Promise<boolean> {
  return new Promise<boolean>((resolve, _reject) => {
    // console.log(file)
    fs.stat(file, (error, stats) => {
      if (error !== null) {
        resolve(false)
      }
      resolve(stats?.isFile() ?? false)
    })
  })
}
