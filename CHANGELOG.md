# Changelog

All notable changes to Kazo Design MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-13

### Added
- **Canvas Properties Dialog**: New dialog to edit document metadata including:
  - Title and Description fields
  - Canvas size with preset buttons (800×600, 1024×768, HD, Full HD, iPhone sizes)
  - Background color picker
  - AI Prompt and Context fields for MCP integration
  - Created/Modified timestamps display
- **MCP Context Persistence**: AI prompts and context are now saved with designs
  - When an AI assistant requests a sketch, the prompt is automatically populated
  - Users can view and edit the AI context in Canvas Properties
  - Context is preserved in saved files for resuming work or using as templates
- **Enhanced Export Format**: Saved Markdown files now include:
  - Description section (user notes)
  - AI Prompt section (original AI request)
  - Improved section headings (English)

### Changed
- Updated companion Markdown file format with clearer section titles
- Improved data flow between VS Code extension and Blazor editor

## [1.0.0] - 2026-01-12

### Added
- **Initial Release** of Kazo Design MCP
- **Visual Sketch Editor**: Create mockups and wireframes directly in VS Code
  - Rectangle, Circle, Line, and Text shape tools
  - Drag & drop positioning
  - Selection and deletion of elements
  - Grid overlay for alignment
  - Zoom and pan controls
- **MCP Tools for AI Assistants**:
  - `kazo_request_sketch`: Request visual sketches from users
  - `kazo_select_option`: Present options with optional sketch reply
  - `kazo_request_text`: Request text input via dialog
  - `kazo_select_file`: File/folder selection dialog
  - `kazo_confirm_action`: Yes/No confirmation dialog
  - `kazo_get_capabilities`: Get information about available features
- **Smart Export**:
  - SVG export for vector graphics
  - JSON export for design data
  - Automatic companion Markdown file generation
- **VS Code Integration**:
  - Native commands and keyboard shortcuts
  - Webview panel with VS Code theming
  - State persistence across sessions
- **Confirm & Return Workflow**: Seamless handoff back to AI assistant
- **Documentation**: Comprehensive README with usage examples
- **Website**: Landing page at [https://desing.kazo.ca/](https://desing.kazo.ca/)

### Technical
- Built with .NET 10 Blazor WebAssembly for high-performance rendering
- TypeScript extension for VS Code integration
- Model Context Protocol (MCP) support for AI assistant communication

[1.0.1]: https://github.com/werddomain/Kazo-Desing-MCP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/werddomain/Kazo-Desing-MCP/releases/tag/v1.0.0
