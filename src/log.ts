import { window } from 'vscode'


const channel = window.createOutputChannel('eslint-disabled')
const getNowFormat = () => {
  const nowDate = new Date()
  return `${ nowDate.getHours() }:${ nowDate.getMinutes() }:${ nowDate.getSeconds() }:${ nowDate.getMilliseconds() }`
}

export { channel }
export default (message: string, showInformationMessage = false) => {
  channel.appendLine(`[${ getNowFormat() }] - ${ message }`)
  showInformationMessage && window.showInformationMessage(message)
}
