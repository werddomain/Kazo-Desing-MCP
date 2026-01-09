# Kazo Design MCP

AI-assisted vector diagram editor for VS Code.

## Features

- **Vector Diagram Editor**: Create and edit SVG-based diagrams directly in VS Code
- **Blazor-powered UI**: Modern, responsive interface built with .NET Blazor WebAssembly
- **File Management**: Save designs as SVG with companion Markdown documentation
- **VS Code Integration**: Native VS Code commands and user interactions

## Usage

1. Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Kazo Design: Open Editor`
3. Use the toolbar to add shapes (Rectangle, Circle, Line, Text)
4. Drag shapes to position them
5. Export your design as SVG or JSON

## Building from Source

### Prerequisites
- .NET 10 SDK
- Node.js 18+
- VS Code

### Build Steps

1. Build the Blazor UI:
```bash
cd src/KazoDesign.Editor
dotnet publish -c Release -o ../../vscode-extension/media/ui
```

2. Build the extension:
```bash
cd vscode-extension
npm install
npm run compile
```

3. Press F5 to launch the extension in debug mode

## File Format

When saving a design, two files are created:
- `design.svg` - The vector image
- `design.md` - Companion documentation with:
  - Title
  - Preview image
  - User prompt (if AI-generated)
  - Technical data in JSON format

## Commands

| Command | Description |
|---------|-------------|
| `Kazo Design: Open Editor` | Opens the diagram editor |
| `Kazo Design: New Design` | Creates a new design |

## License

MIT
