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

export const showStatusBarItem = (text: string, hide = true) => {
  statusBarItem.text = text
  statusBarItem.show()
  hide && hideStatusBarItem()
}

export const hideStatusBarItem = (delay = 5000) => {
  setTimeout(statusBarItem.hide, delay)
}
