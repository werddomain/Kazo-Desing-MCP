import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Message types for communication between VS Code and Blazor
 */
interface BlazorMessage {
    type: string;
    data?: unknown;
}

interface SaveDesignMessage extends BlazorMessage {
    type: 'saveDesign';
    data: {
        svg: string;
        json: string;
        title: string;
        prompt?: string;
    };
}

interface AskUserMessage extends BlazorMessage {
    type: 'askUser';
    data: {
        requestId: string;
        questionType: 'input' | 'quickPick';
        title: string;
        placeholder?: string;
        options?: string[];
    };
}

interface ExportResultMessage extends BlazorMessage {
    type: 'exportResult';
    data: {
        svg: string;
        json: string;
        title: string;
        prompt?: string;
    };
}

/**
 * Provider for the Kazo Design editor webview
 */
export class KazoDesignEditorProvider {
    public static readonly viewType = 'kazoDesign.editor';
    
    private panel: vscode.WebviewPanel | undefined;
    private readonly extensionUri: vscode.Uri;
    private readonly context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.extensionUri = context.extensionUri;
    }

    /**
     * Opens a new Kazo Design editor panel
     */
    public openNewEditor(): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            KazoDesignEditorProvider.viewType,
            'Kazo Design Editor',
            vscode.ViewColumn.One,
            this.getWebviewOptions()
        );

        this.setupWebview(this.panel);
    }

    /**
     * Revives a serialized webview panel
     */
    public revivePanel(panel: vscode.WebviewPanel, _state: unknown): void {
        this.panel = panel;
        this.setupWebview(panel);
    }

    /**
     * Configures the webview options
     */
    private getWebviewOptions(): vscode.WebviewOptions & vscode.WebviewPanelOptions {
        return {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'media', 'ui'),
                vscode.Uri.joinPath(this.extensionUri, 'media')
            ]
        };
    }

    /**
     * Sets up the webview with HTML content and message handlers
     */
    private setupWebview(panel: vscode.WebviewPanel): void {
        panel.webview.html = this.getHtmlForWebview(panel.webview);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async (message: BlazorMessage) => {
                await this.handleMessage(message, panel.webview);
            },
            undefined,
            this.context.subscriptions
        );

        // Clean up when panel is closed
        panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);
    }

    /**
     * Handles messages received from the Blazor webview
     */
    private async handleMessage(message: BlazorMessage, webview: vscode.Webview): Promise<void> {
        switch (message.type) {
            case 'saveDesign':
                await this.handleSaveDesign(message as SaveDesignMessage);
                break;

            case 'askUser':
                await this.handleAskUser(message as AskUserMessage, webview);
                break;

            case 'exportResult':
                await this.handleExportResult(message as ExportResultMessage);
                break;

            case 'ready':
                console.log('Blazor editor is ready');
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }

    /**
     * Handles the save design command from Blazor
     */
    private async handleSaveDesign(message: SaveDesignMessage): Promise<void> {
        const { svg, json, title, prompt } = message.data;

        // Ask user for save location
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(title || 'design'),
            filters: {
                'SVG Files': ['svg'],
                'All Files': ['*']
            },
            title: 'Save Design'
        });

        if (!saveUri) {
            return;
        }

        try {
            const basePath = saveUri.fsPath.replace(/\.svg$/, '');
            const svgPath = `${basePath}.svg`;
            const mdPath = `${basePath}.md`;

            // Ensure directory exists
            const dir = path.dirname(svgPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Save SVG file
            fs.writeFileSync(svgPath, svg, 'utf-8');

            // Create and save companion markdown file
            const markdownContent = this.createMarkdownContent(title, svgPath, prompt, json);
            fs.writeFileSync(mdPath, markdownContent, 'utf-8');

            vscode.window.showInformationMessage(`Design saved to ${basePath}`);

            // Open the markdown file
            const mdUri = vscode.Uri.file(mdPath);
            await vscode.window.showTextDocument(mdUri, { preview: false });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save design: ${error}`);
        }
    }

    /**
     * Creates the companion markdown file content
     */
    private createMarkdownContent(title: string, svgPath: string, prompt: string | undefined, json: string): string {
        const svgFileName = path.basename(svgPath);
        
        let content = `# ${title || 'Untitled Design'}\n\n`;
        content += `![Design](${svgFileName})\n\n`;
        
        if (prompt) {
            content += `## Prompt Utilisateur\n\n${prompt}\n\n`;
        }
        
        content += `## Données Techniques (JSON)\n\n`;
        content += '```json\n';
        content += json;
        content += '\n```\n';

        return content;
    }

    /**
     * Handles user interaction requests from Blazor
     */
    private async handleAskUser(message: AskUserMessage, webview: vscode.Webview): Promise<void> {
        const { requestId, questionType, title, placeholder, options } = message.data;

        let result: string | undefined;

        if (questionType === 'quickPick' && options) {
            result = await vscode.window.showQuickPick(options, {
                title: title,
                placeHolder: placeholder
            });
        } else {
            result = await vscode.window.showInputBox({
                title: title,
                placeHolder: placeholder,
                prompt: title
            });
        }

        // Send response back to Blazor
        webview.postMessage({
            type: 'userResponse',
            data: {
                requestId,
                value: result
            }
        });
    }

    /**
     * Handles export result from Blazor
     */
    private async handleExportResult(message: ExportResultMessage): Promise<void> {
        // This can be used for additional processing after export
        console.log('Export result received:', message.data.title);
    }

    /**
     * Sends a command to load a design in Blazor
     */
    public loadDesign(json: string): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'loadDesign',
                data: json
            });
        }
    }

    /**
     * Requests an export from Blazor
     */
    public requestExport(): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'exportDesign'
            });
        }
    }

    /**
     * Generates the HTML content for the webview
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        const mediaPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'ui');
        
        // Get URIs for resources
        const baseUri = webview.asWebviewUri(mediaPath);
        
        // Read the original index.html from the Blazor build
        const indexPath = path.join(this.extensionUri.fsPath, 'media', 'ui', 'index.html');
        
        let htmlContent: string;
        
        if (fs.existsSync(indexPath)) {
            htmlContent = fs.readFileSync(indexPath, 'utf-8');
            
            // Update base href for webview
            htmlContent = htmlContent.replace(
                '<base href="/" />',
                `<base href="${baseUri}/" />`
            );
            
            // Inject VS Code API script before other scripts
            const vscodeApiScript = `
                <script>
                    const vscode = acquireVsCodeApi();
                    window.vscodeApi = vscode;
                    
                    // Override postMessage for Blazor interop
                    window.kazoDesign = window.kazoDesign || {};
                    window.kazoDesign.postMessage = function(message) {
                        vscode.postMessage(message);
                    };
                    
                    // Listen for messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (window.kazoDesign && window.kazoDesign.handleExtensionMessage) {
                            window.kazoDesign.handleExtensionMessage(message);
                        }
                    });
                </script>
            `;
            
            htmlContent = htmlContent.replace('<head>', `<head>\n${vscodeApiScript}`);
            
            // Update resource paths to use webview URIs
            htmlContent = htmlContent.replace(/href="([^"]+)"/g, (match, p1) => {
                if (p1.startsWith('http') || p1.startsWith('data:') || p1.startsWith('#')) {
                    return match;
                }
                const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, p1));
                return `href="${resourceUri}"`;
            });
            
            htmlContent = htmlContent.replace(/src="([^"]+)"/g, (match, p1) => {
                if (p1.startsWith('http') || p1.startsWith('data:')) {
                    return match;
                }
                const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, p1));
                return `src="${resourceUri}"`;
            });
            
        } else {
            // Fallback HTML when Blazor build is not available
            htmlContent = this.getFallbackHtml(webview);
        }

        return htmlContent;
    }

    /**
     * Returns fallback HTML when Blazor build is not available
     */
    private getFallbackHtml(_webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Kazo Design Editor</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background-color: #1e1e1e;
                        color: #cccccc;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .message {
                        text-align: center;
                        padding: 20px;
                    }
                    h1 { color: #007acc; }
                    p { margin: 10px 0; }
                    code {
                        background: #2d2d30;
                        padding: 2px 6px;
                        border-radius: 3px;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <h1>Kazo Design Editor</h1>
                    <p>The Blazor UI has not been built yet.</p>
                    <p>Run the following commands to build the UI:</p>
                    <p><code>cd src/KazoDesign.Editor && dotnet publish -c Release</code></p>
                    <p>Then copy the published files to the <code>media/ui</code> folder.</p>
                </div>
            </body>
            </html>
        `;
    }
}
