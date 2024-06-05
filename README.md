# 🏗 azd-infra

[![NPM version](https://img.shields.io/npm/v/azd-infra.svg?style=flat-square)](https://www.npmjs.com/package/azd-infra)
[![Build Status](https://img.shields.io/github/actions/workflow/status/sinedied/azd-infra/ci.yml?style=flat-square&label=Build)](https://github.com/sinedied/azd-infra/actions)
![Node version](https://img.shields.io/node/v/azd-infra?style=flat-square)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7?style=flat-square)](https://github.com/sindresorhus/xo)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

> Command line tool to manage your Azure Developer CLI (AZD) projects' infrastructure.

## Usage

You need [Node.js v20+](https://nodejs.org) and git installed on your machine to use this tool.

You can either install it globally:

```bash
npm install -g azd-infra
```

Or use it directly with `npx` without installing it:

```bash
npx azd-infra <command>
```

## Available commands

- `azd-infra add`: Adds one or more AZD core templates to your infrastructure.
- `azd-infra update`: Checks your infrastructure and updates it using latest AZD core templates.
- `azd-infra fix`: Checks your infrastructure dependency graph for missing or unused resources and fixes them.
- `azd-infra refresh`: Runs `update` and `fix` in sequence.

Commands are interactive and will ask you for confirmation before applying changes, unless you use the `--yes` flag.

