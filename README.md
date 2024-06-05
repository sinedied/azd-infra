# azd-infra

Command line tool to manage your Azure Developer CLI (AZD) projects' infrastructure.

## Usage

You need [Node.js >= 20](https://nodejs.org) and git installed on your machine to use this tool.

You can either install it globally:

```bash
npm install -g azd-infra
```

Or use it directly with `npx` without installing it:

```bash
npx azd-infra <command>
```

## Available commands

- `azd-infra update`: Checks your project's infrastructure and updates it using latest AZD core templates.
- `azd-infra clean`: Checks your project's infrastructure dependency graph for missing or unused resources and fixes them.

