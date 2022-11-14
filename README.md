<p align="center">
  <a href="https://github.com/lvjiaxuan/eslint-disable" target="_blank">
    <img src="./assets/icon.png" alt="eslint-disable" height="250" width="250" />
  </a>
</p>

<hr />

<p align="center">Insert `eslint-disable` directive comment with present problem rules for VS Code..</p>

[![](https://img.shields.io/visual-studio-marketplace/v/lvjiaxuan.eslint-disable?label=Visual%20Studio%20Marketplace)
](https://marketplace.visualstudio.com/items?itemName=lvjiaxuan.eslint-disable)
[![](https://img.shields.io/visual-studio-marketplace/azure-devops/installs/total/lvjiaxuan.eslint-disable?label=Installs)
](https://marketplace.visualstudio.com/items?itemName=lvjiaxuan.eslint-disable)

## Features

- Simple snippets with typing `eslint-disable`.
- Select one or **multiple lines** which have rule problems from ESLint, and disable it with:
  - The editor context menu.
  - Cmd(`eslint-disable.disableIT`).
  - Keyboard shortcuts(`ctrl + alt + d`).

> **Note**
> 
> It doesn't need to select full characters of lines. See preview below.

## Preview

![](assets/1.gif)

![](assets/2.gif)

## Todo

- [ ] contributes: `eslint-disable.enable`.
- [ ] commands: `eslint-disable.restart`.
- [ ] Support multi-selections disable at the same action.
- [ ] Pre-Linting at activation time.
- [ ] Snippets supports present problem rules.
