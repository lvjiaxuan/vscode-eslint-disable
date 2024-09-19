import { window } from 'vscode'

const channel = window.createOutputChannel('VSCode ESLint Disable')

export { channel }

export default (
  message: string,
  ...informationMessage: string[]
) => {
  channel.appendLine(`[${getNowFormat()}] - ${message}`)
  informationMessage && window.showInformationMessage(message, ...informationMessage)
}

function getNowFormat() {
  const nowDate = new Date()
  return `${nowDate.getHours()}:${nowDate.getMinutes()}:${nowDate.getSeconds()}:${nowDate.getMilliseconds()}`
}
