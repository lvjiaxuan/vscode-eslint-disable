import { window } from 'vscode'

const channel = window.createOutputChannel('VSCode ESLint Disable')
function getNowFormat() {
  const nowDate = new Date()
  return `${nowDate.getHours()}:${nowDate.getMinutes()}:${nowDate.getSeconds()}:${nowDate.getMilliseconds()}`
}

export { channel }
export default (
  message = '--',
  showInformationMessage = false,
  ...informationMessage: string[]
) => {
  channel.appendLine(`[${getNowFormat()}] - ${message}`)
  showInformationMessage && void window.showInformationMessage(message, ...informationMessage)
}
