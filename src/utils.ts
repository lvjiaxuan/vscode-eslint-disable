import vscode from 'vscode'
import path from 'path'
import fs from 'fs'

// vscode.Task

export const getTextBylines = (startLine: number, endLine?: number) =>
  vscode.window.activeTextEditor?.document.getText(
    new vscode.Range(
      startLine, 0, endLine ?? startLine,
      Number.MAX_VALUE,
    ),
  )

/**
 * Find a ESLint installation at a given root path.
 * @param rootPath the root path.
 * @returns the eslint installation or the unresolved command eslint.
 */
export async function findEslint(rootPath: string): Promise<string> {
  const platform = process.platform
  if (platform === 'win32' && await existFile(path.join(rootPath, 'node_modules', '.bin', 'eslint.cmd'))) {
    return path.join('.', 'node_modules', '.bin', 'eslint.cmd')
  } else if ((platform === 'linux' || platform === 'darwin') && await existFile(path.join(rootPath, 'node_modules', '.bin', 'eslint'))) {
    return path.join('.', 'node_modules', '.bin', 'eslint')
  } else {
    return 'eslint'
  }
}

function existFile(file: string): Promise<boolean> {
  return new Promise<boolean>((resolve, _reject) => {
    fs.stat(file, (error, stats) => {
      if (error !== null) {
        resolve(false)
      }
      resolve(stats.isFile())

    })
  })
}
