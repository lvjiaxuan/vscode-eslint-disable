<p align="center">
  <a href="https://github.com/lvjiaxuan/vscode-eslint-disable" target="_blank">
    <img src="./assets/logo-r.png" alt="vscode-eslint-disable" height="280" width="280" />
  </a>
</p>

<hr />

<p align="center">Intelligently  disable ESLint rules for VS Code.</p>

![](https://github.com/lvjiaxuan/vscode-eslint-disable/actions/workflows/ci.yml/badge.svg)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/lvjiaxuan.vscode-eslint-disable?color=%232ba1f1&logo=visual-studio-code&logoColor=%232ba1f1)
](https://marketplace.visualstudio.com/items?itemName=lvjiaxuan.vscode-eslint-disable)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/azure-devops/installs/total/lvjiaxuan.vscode-eslint-disable?label=Installs&logo=visualstudiocode&logoColor=%232ba1f1)
](https://marketplace.visualstudio.com/items?itemName=lvjiaxuan.vscode-eslint-disable)
[![GitHub Repo stars](https://img.shields.io/github/stars/lvjiaxuan/vscode-eslint-disable)](https://github.com/lvjiaxuan/vscode-eslint-disable)

<!-- ## Usage
1. Place the cursor on a single line and then press `ctrl + alt + d` to disable the rule(s) for the selected line.

or select multiple lines that have rule problem(s) from the ESLint extension's *IntelliSense*. You can then disable rule(s) for the selected line(s) by pressing `ctrl + alt + d`, or for the entire file by pressing `ctrl + alt + e`.
2. Disable all rule problems for the entire file by pressing `ctrl + alt + a`. -->

## Usage

1. Place the cursor on the problem line at any position.
2. Press `ctrl + alt + d` to insert `// eslint-disable-next-line "explicit rule(s)"`.

For multiple lines, it inserts block comments:
<!-- eslint-skip -->
```js
/* eslint-disable no-console */
console.log('hello')
console.log('world')
/* eslint-enable no-console */
```

> [!TIP]
> For multiple lines, you don't need to select the full text of lines. Just ensure the selection ranges cover the problem lines.

### More usages

1. `ctrl + alt + e`: disable rule(s) of line(s) for entire file.
2. `ctrl + alt + a`: disable all rule(s) for entire file.

## Motivation

The official ESLint extension has few steps to disable rules as:
1. Place cursor on the problem line - (It doesn't support for multiple lines.).
2. Press `ctrl + .` to open the *Quick Fix* menu.
3. Select which rule to disable - (It doesn't support for multiple rules).

With this ext, you can disable multiple rules for multiple lines with one step.

## Preview

Single line.

![single](assets/1.gif)

Multiple lines, you can press `ctrl + d` to select another pair of rule(s) on the other side.

![multiple](assets/2.gif)
