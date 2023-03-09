import { workspace } from 'vscode'

const config = workspace.getConfiguration('eslint-disable')

const orgConfig = workspace.getConfiguration('eslint')

export default {
  disable: config.get('disable', false),
  preLinting: config.get('preLinting', true),
  useFlatConfig: orgConfig.get('experimental.useFlatConfig', false),
}
