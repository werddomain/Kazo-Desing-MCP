# Kazo Design MCP

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=werddomain.kazo-design-mcp)
[![License](https://img.shields.io/badge/License-BSD%202--Clause-green.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-10.0-purple?logo=dotnet)](https://dotnet.microsoft.com/)
[![Blazor](https://img.shields.io/badge/Blazor-WebAssembly-blueviolet?logo=blazor)](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor)

An AI-assisted vector diagram editor for Visual Studio Code. Powered by a high-performance C# rendering engine (.NET 10 Blazor WebAssembly), it enables AI-assisted generation of SVG diagrams that are user-editable and automatically saved as rich technical documentation (Markdown + JSON).

![Editor Overview](screenshots/editor-overview.svg)

## Features

### 🎨 Vector Diagram Editor
Create and edit professional SVG-based diagrams directly within VS Code. The editor provides a modern, responsive interface with real-time rendering.

### 🧠 AI-Assisted Design (MCP)
Leverage AI capabilities to generate diagrams from natural language descriptions. The Model Context Protocol (MCP) integration allows seamless communication between your AI assistant and the editor.

### 🔧 Shape Tools
- **Rectangle**: Create rectangular shapes with customizable dimensions
- **Circle**: Add circles with adjustable radius
- **Line**: Draw connecting lines between elements
- **Text**: Insert text labels with font customization

![Toolbar](screenshots/toolbar.svg)

### 💾 Smart Export Format
When saving a design, two files are created automatically:
- **SVG file**: The vector image for use in documentation, websites, or further editing
- **Markdown file**: Companion documentation containing:
  - Title and preview image
  - Original AI prompt (if AI-generated)
  - Technical data in JSON format for version control and future editing

![Export Format](screenshots/export-format.svg)

### 🎯 Interactive Canvas
- **Drag & Drop**: Move elements freely on the canvas
- **Selection**: Click to select elements for editing or deletion
- **Grid**: Visual grid overlay for precise alignment
- **Zoom**: Ctrl+scroll to zoom in/out
- **Pan**: Scroll to pan around the canvas

### 🔌 VS Code Integration
- Native VS Code commands and keyboard shortcuts
- Webview panel with full VS Code theming support
- State persistence across VS Code sessions

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Kazo Design MCP"
4. Click **Install**

### From VSIX File

1. Download the `.vsix` file from [Releases](https://github.com/werddomain/Kazo-Desing-MCP/releases)
2. In VS Code, go to Extensions
3. Click the `...` menu and select "Install from VSIX..."
4. Select the downloaded file

## Usage

### Opening the Editor

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Kazo Design" and select one of:
   - `Kazo Design: Open Editor` - Opens the diagram editor
   - `Kazo Design: New Design` - Creates a new design

### Creating Shapes

1. Click a shape tool in the toolbar (Rectangle, Circle, Line, or Text)
2. The shape will be added to the canvas at a random position
3. Drag shapes to reposition them
4. Click on a shape to select it
5. Use the Delete button to remove selected shapes

### Exporting Your Design

1. Click the **Export SVG** button (blue) to download the SVG file
2. Click the **Export JSON** button to download the design data
3. Use the save functionality to create both SVG and Markdown files

### Commands

| Command | Description |
|---------|-------------|
| `Kazo Design: Open Editor` | Opens the diagram editor panel |
| `Kazo Design: New Design` | Creates a new blank design |

## Building from Source

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)

### Build Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/werddomain/Kazo-Desing-MCP.git
   cd Kazo-Desing-MCP
   ```

2. **Build the Blazor UI**
   ```bash
   cd src/KazoDesign.Editor
   dotnet restore
   dotnet publish -c Release -o ../../vscode-extension/media/ui
   ```

3. **Build the VS Code extension**
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   ```

4. **Run in development mode**
   - Open the project in VS Code
   - Press `F5` to launch the Extension Development Host

### Project Structure

```
Kazo-Desing-MCP/
├── src/
│   └── KazoDesign.Editor/       # Blazor WebAssembly UI
│       ├── Components/          # Razor components (toolbar, canvas, shapes)
│       ├── Models/              # Data models for design elements
│       ├── Pages/               # Main page components
│       ├── Services/            # Design service and state management
│       └── wwwroot/             # Static assets and JavaScript
├── vscode-extension/            # VS Code extension
│   ├── src/                     # TypeScript source
│   ├── media/                   # UI assets (Blazor build output)
│   └── package.json             # Extension manifest
├── screenshots/                 # Documentation images
└── KazoDesign.sln              # Visual Studio solution file
```

## Publishing

See [PUBLISH.md](PUBLISH.md) for detailed instructions on publishing the extension to the VS Code Marketplace.

## File Format

### Design JSON Structure

```json
{
  "id": "uuid",
  "title": "My Design",
  "canvasWidth": 800,
  "canvasHeight": 600,
  "backgroundColor": "#2d2d30",
  "elements": [
    {
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 150,
      "height": 100,
      "fill": "#4a90d9",
      "stroke": "#0078d4"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "modifiedAt": "2024-01-01T00:00:00Z"
}
```

### Supported Shape Types

| Type | Properties |
|------|------------|
| `rectangle` | x, y, width, height, fill, stroke, cornerRadius |
| `circle` | x, y, radius, fill, stroke |
| `line` | x, y, x2, y2, stroke, strokeWidth |
| `text` | x, y, content, fontSize, fill, fontFamily |
| `image` | x, y, width, height, href |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the BSD 2-Clause License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Blazor WebAssembly](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor)
- Powered by [VS Code Extension API](https://code.visualstudio.com/api)
- SVG rendering and manipulation

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/werddomain/Kazo-Desing-MCP/issues) on GitHub.
