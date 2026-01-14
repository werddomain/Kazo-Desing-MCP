# Kazo Design MCP

![Kazo Design MCP Logo](Kazo_Desing_MCP_LOGO.png)

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=KazoMedia.kazo-design-mcp)
[![License](https://img.shields.io/badge/License-BSD%202--Clause-green.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-10.0-purple?logo=dotnet)](https://dotnet.microsoft.com/)
[![Blazor](https://img.shields.io/badge/Blazor-WebAssembly-blueviolet?logo=blazor)](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor)

A Visual Studio Code extension that helps you communicate your design intentions to AI assistants like GitHub Copilot. Create quick sketches, mockups, or wireframes to visually express what you want the AI to build. Powered by a high-performance C# rendering engine (.NET 10 Blazor WebAssembly).

![Editor Overview](screenshots/editor-overview.svg)

## Workflow

When working with an AI assistant (like GitHub Copilot), use Kazo Design MCP to better communicate your vision:

1. **Request**: Ask the AI to create something (e.g., a web page, a component, a UI layout)
2. **Sketch**: The AI invites you to create a visual sketch of what you have in mind
3. **Draw**: Open the SVG editor and draw your idea using simple shapes
4. **Confirm**: Click the "Confirm & Return to AI" button when your sketch is ready
5. **Save** (Optional): Choose to save your sketch with a custom name and location
6. **Generate**: The AI uses your sketch to better understand and implement your request

## Features

### 🎨 Quick Sketch Editor
Create rapid mockups and wireframes directly within VS Code. The editor provides a simple, intuitive interface for expressing your design ideas to AI assistants.

### 🧠 AI Communication Tool (MCP)
The Model Context Protocol (MCP) integration enables seamless communication between you and your AI assistant. Your sketches become visual context that helps the AI understand exactly what you want.

### 🔧 Shape Tools
- **Rectangle**: Create boxes for layouts, containers, or buttons
- **Circle**: Add circular elements for icons, avatars, or decorations
- **Line**: Draw connections, separators, or pointing elements
- **Text**: Add labels to explain different parts of your sketch

![Toolbar](screenshots/toolbar.svg)

### ✅ Confirm & Return
When your sketch is ready:
- Click the "Confirm & Return to AI" button
- Optionally save your sketch to a file
- The AI receives your visual context and can proceed with your request

### 💾 Smart Export Format
When saving a design, two files are created automatically:
- **SVG file**: The vector image for use in documentation, websites, or further editing
- **Markdown file**: Companion documentation containing:
  - Title and preview image
  - Original prompt or description
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

## Technical Notes: Blazor in VS Code WebView

Running Blazor WebAssembly inside a VS Code WebView requires several patches because the WebView uses a custom URL scheme (`vscode-webview://`) that .NET's `System.Uri` cannot parse.

### The Problem

When Blazor starts, it reads the browser's URL to initialize `NavigationManager`. The `vscode-webview://` scheme causes a `net_uri_BadHostName` exception because .NET's URI parser doesn't recognize it as a valid scheme.

### The Solution

We implement multiple layers of fixes:

#### 1. JavaScript Navigation Interceptor (index.html)

Before Blazor loads, we patch `Blazor._internal.navigationManager` to return fake HTTP URLs:

```javascript
// Intercept Blazor's NavigationManager initialization
window._blazorNavigationInterceptor = {
    getBaseURI: function() { return 'https://localhost/'; },
    getLocationHref: function() { return 'https://localhost/'; }
};

// Patch after Blazor script loads but before start
if (window.Blazor && window.Blazor._internal && window.Blazor._internal.navigationManager) {
    window.Blazor._internal.navigationManager = {
        ...window.Blazor._internal.navigationManager,
        getBaseURI: () => 'https://localhost/',
        getLocationHref: () => 'https://localhost/'
    };
}
```

#### 2. FakeNavigationManager (C#)

A custom `NavigationManager` implementation that ignores real URLs:

```csharp
// Services/FakeNavigationManager.cs
public class FakeNavigationManager : NavigationManager, IHostEnvironmentNavigationManager
{
    public FakeNavigationManager()
    {
        Initialize("https://localhost/", "https://localhost/");
    }

    void IHostEnvironmentNavigationManager.Initialize(string baseUri, string uri)
    {
        // Ignore real URIs, use fake ones
        Initialize("https://localhost/", "https://localhost/");
    }

    protected override void NavigateToCore(string uri, NavigationOptions options)
    {
        // Navigation not supported in WebView
    }
}
```

Register in `Program.cs`:
```csharp
builder.Services.AddScoped<NavigationManager, FakeNavigationManager>();
```

#### 3. Removed Router and HeadOutlet

These components internally use `NavigationManager` and can trigger URI parsing before our patches take effect:

```csharp
// Program.cs - HeadOutlet removed
builder.RootComponents.Add<App>("#app");
// builder.RootComponents.Add<HeadOutlet>("head::after"); // REMOVED
```

```razor
@* App.razor - Router replaced with direct rendering *@
@using KazoDesign.Editor.Layout
@using KazoDesign.Editor.Pages

<MainLayout>
    <Home />
</MainLayout>
```

#### 4. Placeholder HttpClient BaseAddress

The default `HttpClient` registration uses `builder.HostEnvironment.BaseAddress` which also fails:

```csharp
// Use placeholder URL instead of HostEnvironment.BaseAddress
builder.Services.AddScoped(sp => new HttpClient { 
    BaseAddress = new Uri("https://localhost/") 
});
```

### Debugging Tips

1. **Open WebView DevTools**: `Ctrl+Shift+P` → "Developer: Open Webview Developer Tools"
2. **Check Output Channel**: View → Output → "Kazo Design"
3. **Error Panel**: A debug panel appears in the WebView when errors occur

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
