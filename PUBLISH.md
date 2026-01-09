# Publishing Guide for Kazo Design MCP Extension

This document describes the process of publishing the Kazo Design MCP VS Code extension to the Visual Studio Code Marketplace and Open VSX Registry.

## Prerequisites

Before publishing, ensure you have:

1. **Visual Studio Code Publisher Account**
   - Create an account at [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
   - Create a publisher with the ID `werddomain`

2. **Personal Access Token (PAT) for VS Code Marketplace**
   - Go to [Azure DevOps](https://dev.azure.com/)
   - Create a Personal Access Token with `Marketplace > Manage` scope
   - Store this as `VSCE_PAT` in your repository secrets

3. **Open VSX Token (Optional)**
   - Create an account at [Open VSX Registry](https://open-vsx.org/)
   - Generate an access token
   - Store this as `OVSX_PAT` in your repository secrets

## Build Requirements

- **.NET 10 SDK** - Required to build the Blazor WebAssembly UI
- **Node.js 20+** - Required to compile TypeScript and package the extension
- **vsce** - VS Code Extension CLI tool (`npm install -g @vscode/vsce`)

## Manual Publishing

### Step 1: Build the Blazor UI

```bash
cd src/KazoDesign.Editor
dotnet restore
dotnet publish -c Release -o ../../vscode-extension/media/ui
```

### Step 2: Build the Extension

```bash
cd vscode-extension
npm ci
npm run compile
```

### Step 3: Package the Extension

```bash
vsce package
```

This creates a `.vsix` file (e.g., `kazo-design-mcp-0.1.0.vsix`).

### Step 4: Publish to VS Code Marketplace

```bash
vsce publish
```

Or publish a pre-release version:

```bash
vsce publish --pre-release
```

### Step 5: Publish to Open VSX (Optional)

```bash
npm install -g ovsx
ovsx publish
```

## Automated Publishing (GitHub Actions)

The repository includes a GitHub Actions workflow (`.github/workflows/publish-extension.yml`) that automates the publishing process.

### Triggering the Workflow

#### Option 1: Create a GitHub Release

1. Go to the repository's **Releases** page
2. Click **Draft a new release**
3. Create a new tag (e.g., `v0.1.0`)
4. Fill in the release title and description
5. Click **Publish release**

The workflow will automatically build and publish the extension.

#### Option 2: Manual Trigger

1. Go to **Actions** tab in the repository
2. Select **Publish VS Code Extension** workflow
3. Click **Run workflow**
4. Choose the release type (`release` or `pre-release`)
5. Click **Run workflow**

### Required Secrets

Configure these secrets in your repository settings (**Settings > Secrets and variables > Actions**):

| Secret | Description |
|--------|-------------|
| `VSCE_PAT` | Personal Access Token for VS Code Marketplace |
| `OVSX_PAT` | Access Token for Open VSX Registry (optional) |

## Versioning

Update the version in `vscode-extension/package.json` before publishing:

```json
{
  "version": "0.1.0"
}
```

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards compatible)
- **PATCH** version for bug fixes (backwards compatible)

## Pre-release Versions

For pre-release versions:
- Use the `--pre-release` flag when publishing
- Users can opt-in to receive pre-release updates in VS Code

## Verification

After publishing:

1. **VS Code Marketplace**: Visit [https://marketplace.visualstudio.com/items?itemName=werddomain.kazo-design-mcp](https://marketplace.visualstudio.com/items?itemName=werddomain.kazo-design-mcp)
2. **Open VSX Registry**: Visit [https://open-vsx.org/extension/werddomain/kazo-design-mcp](https://open-vsx.org/extension/werddomain/kazo-design-mcp)
3. **Install in VS Code**: Search for "Kazo Design MCP" in the Extensions view

## Troubleshooting

### "Personal Access Token missing"

Ensure the `VSCE_PAT` secret is correctly set in your repository secrets.

### "Publisher 'werddomain' not found"

Create a publisher account at the VS Code Marketplace with the publisher ID matching `package.json`.

### Build Fails

- Ensure .NET 10 SDK is installed
- Ensure Node.js 20+ is installed
- Run `npm ci` to install exact versions from lock file

### Extension not visible after publishing

It may take a few minutes for the extension to appear in the marketplace. Check the publisher dashboard for any errors.
