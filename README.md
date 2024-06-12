# 🏗 azd-infra

[![NPM version](https://img.shields.io/npm/v/azd-infra.svg?style=flat-square)](https://www.npmjs.com/package/azd-infra)
[![Build Status](https://img.shields.io/github/actions/workflow/status/sinedied/azd-infra/ci.yml?style=flat-square&label=Build)](https://github.com/sinedied/azd-infra/actions)
![Node version](https://img.shields.io/node/v/azd-infra?style=flat-square)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7?style=flat-square)](https://github.com/sindresorhus/xo)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

Command line tool to manage your [Azure Developer CLI (AZD)](https://aka.ms/azd) projects' infrastructure.

> [!NOTE]
> Only Bicep templates are supported for now.

## Usage

You need [Node.js v20+](https://nodejs.org) and git installed on your machine to use this tool.
You can either install the CLI globally:

```bash
npm install -g azd-infra
```

Or use it directly with `npx` without installing it:

```bash
npx azd-infra@latest <command>
```

> [!TIP]
> The quickest way to get started is to run the following command in your project's root folder:
>
> ```bash
> npx azd-infra@latest refresh
> ```
>
> This will interactively update your project's infrastructure with the latest AZD core templates and fix any missing or unused templates.

## Available commands

- `azd-infra add`: Adds one or more AZD core templates to your infrastructure.
- `azd-infra update`: Checks your infrastructure and updates it using latest AZD core templates.
- `azd-infra fix`: Checks your infrastructure dependency graph for missing or unused resources and fixes them.
- `azd-infra refresh`: Runs `update` and `fix` in sequence.

Commands are interactive and will ask you for confirmation before applying changes, unless you use the `--yes` flag.

### `azd-infra add`

This command will perform the following tasks:
1. Clone the latest version of the AZD repository in a temporary folder.
2. Ask you to select the templates you want to add to your infrastructure.
3. Resolve the dependencies of the selected templates
4. Ask you to confirm the changes
5. Copy the selected templates to your infrastructure folder.

### `azd-infra update`

This command will perform the following tasks:
1. Clone the latest version of the AZD repository in a temporary folder.
2. Scan your project's infrastructure folder and compare `core` templates with their latest version.
3. List each core template of your project to show you its status:
  - `current`: if the template is up to date
  - `update`: if a newer version available
  - `missing`: if no matching file existing in latest core templates. This usually happens when a template has been renamed or removed.
4. Ask you to confirm the changes
5. Update the templates in your infrastructure folder. Missing templates will be left untouched.

### `azd-infra fix`

This command will perform the following tasks:
1. Scan your project's infrastructure folder and build a dependency graph of all resources. 
2. List missing referenced and unused templates
3. Ask you to confirm the changes
4. Remove unused templates and add missing templates to your infrastructure folder.

### `azd-infra refresh`

This command will run `update` and `fix` in sequence. This is the recommended command to keep your infrastructure up to date, as sometimes updating a template can introduce new dependencies that will be detected and fixed by the `fix` command.
