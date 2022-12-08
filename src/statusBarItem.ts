import { StatusBarAlignment, type StatusBarItem, window } from 'vscode'

let statusBarItem: StatusBarItem

const aop = () => {
  if (!statusBarItem) {
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
  }
}

export default {
  get value () {
    aop()
    return statusBarItem
  },
}

export const showStatusBarItem = (text: string, time = 5000) => {
  statusBarItem.text = text
  statusBarItem.show()
  time > 0 && hideStatusBarItem(time)
}

export const hideStatusBarItem = (delay = 5000) => {
  setTimeout(() => statusBarItem.hide(), delay)
}
