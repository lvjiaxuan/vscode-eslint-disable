import { workspace } from 'vscode'

export const workspacePath = workspace.workspaceFolders?.[0].uri.fsPath

