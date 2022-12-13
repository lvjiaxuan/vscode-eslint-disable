import { window } from 'vscode'


const channel = window.createOutputChannel('vscode-eslint-disable')
const getNowFormat = () => {
  const nowDate = new Date()
  return `${ nowDate.getHours() }:${ nowDate.getMinutes() }:${ nowDate.getSeconds() }:${ nowDate.getMilliseconds() }`
}

export { channel }
export default (
  message = '--',
  showInformationMessage = false,
  ...informationMessage: string[]
) => {
  channel.appendLine(`[${ getNowFormat() }] - ${ message }`)
  showInformationMessage && window.showInformationMessage(message, ...informationMessage)
}
