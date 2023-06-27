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

## Features
1. Select a single line or **multiple lines** which have rule problems from the extension of ESLint IntelliSense, and it can either disable rules on selected lines by `ctrl + alt + d` or disable for the entire file by `ctrl + alt + e`.
2. Disable all problem rules by `ctrl + alt + a`.


> **Note**
> 
> It doesn't need to select all text of lines. See the preview below.

## Preview

For single line.

![single](assets/1.gif)


For multiple lines, you can press `ctrl + d` to select another pair of rules on the other side.

![multiple](assets/2.gif)

## TODO

- [ ] Support multi-selections disabled at the same action.
