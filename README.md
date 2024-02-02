<p align="center">
  <a href="https://github.com/lvjiaxuan/vscode-eslint-disable" target="_blank">
    <img src="./assets/logo-r.png" alt="vscode-eslint-disable" height="280" width="280" />
  </a>
</p>

<hr />

<p align="center">Use hotkeys to insert the corresponding disabling rules comment.</p>

![](https://github.com/lvjiaxuan/vscode-eslint-disable/actions/workflows/ci.yml/badge.svg)
[![](https://img.shields.io/visual-studio-marketplace/v/lvjiaxuan.vscode-eslint-disable?color=%232ba1f1&logo=visual-studio-code&logoColor=%232ba1f1)
](https://marketplace.visualstudio.com/items?itemName=lvjiaxuan.vscode-eslint-disable)
[![](https://img.shields.io/visual-studio-marketplace/azure-devops/installs/total/lvjiaxuan.vscode-eslint-disable?label=Installs)
](https://marketplace.visualstudio.com/items?itemName=lvjiaxuan.vscode-eslint-disable)
[![](https://img.shields.io/visual-studio-marketplace/azure-devops/installs/total/lvjiaxuan.eslint-disable?label=Deprecated%20Identifier%20Installs)
](https://marketplace.visualstudio.com/items?itemName=lvjiaxuan.eslint-disable)

## Usage
1. Select a single line or **multiple lines** that have rule problems from the ESLint extension's *IntelliSense*, and you can either disable these rules for selected lines by `ctrl + alt + d` or for the entire file by `ctrl + alt + e`.
2. Disable all rule problems for the entrie file by `ctrl + alt + a`.

> [!TIP]
> It doesn't always have to select characters, even just only a cursor focus can works. See the preview below.

## Preview

For single line.

![single](assets/1.gif)

For multiple lines, you can press `ctrl + d` to select another pair of rules on the other side.

![multiple](assets/2.gif)
