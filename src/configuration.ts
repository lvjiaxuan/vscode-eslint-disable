import { workspace } from 'vscode'

export const config = workspace.getConfiguration('eslint-disable')

export default {
  disable: config.get('disable', false),
  preLinting: config.get('preLinting', true),
}
