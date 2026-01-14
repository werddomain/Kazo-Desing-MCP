import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SketchRequestManager } from './mcpTools';

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

interface ConfirmSketchMessage extends BlazorMessage {
    type: 'confirmSketch';
    data: {
        svg: string;
        json: string;
        title: string;
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
    private readonly outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.extensionUri = context.extensionUri;
        this.outputChannel = outputChannel;
        this.log('KazoDesignEditorProvider initialized');
    }

    /**
     * Logs a message to the output channel
     */
    private log(message: string, showChannel: boolean = false): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
        if (showChannel) {
            this.outputChannel.show(true);
        }
    }

    /**
     * Logs an error to the output channel and shows it
     */
    private logError(message: string, details?: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
        if (details) {
            this.outputChannel.appendLine(details);
        }
        this.outputChannel.show(true);
    }

    /**
     * Opens a new Kazo Design editor panel
     */
    public openNewEditor(): void {
        this.log('Opening Kazo Design editor...');
        
        if (this.panel) {
            this.log('Revealing existing panel');
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            KazoDesignEditorProvider.viewType,
            'Kazo Design Editor',
            vscode.ViewColumn.One,
            this.getWebviewOptions()
        );

        this.log('Created new webview panel');
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
                vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'wwwroot'),
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

            case 'confirmSketch':
                await this.handleConfirmSketch(message as ConfirmSketchMessage);
                break;

            case 'ready':
                this.log('Blazor editor is ready');
                break;

            case 'error':
                this.handleBlazorError(message as { type: string; data: { message: string; error?: string; source?: string; line?: number; stack?: string } });
                break;

            case 'log':
                this.handleBlazorLog(message as { type: string; level?: string; message?: string; data?: unknown });
                break;

            default:
                this.log(`Unknown message type: ${message.type}`);
        }
    }

    /**
     * Handles log messages from Blazor
     */
    private handleBlazorLog(message: { type: string; level?: string; message?: string; data?: unknown }): void {
        const level = message.level || 'info';
        const logMessage = message.message || 'Unknown';
        const data = message.data ? ` | ${JSON.stringify(message.data)}` : '';
        
        if (level === 'error' || level === 'warn') {
            this.logError(`[Blazor ${level.toUpperCase()}] ${logMessage}`, data ? `Data: ${data}` : undefined);
        } else {
            this.log(`[Blazor ${level.toUpperCase()}] ${logMessage}${data}`);
        }
    }

    /**
     * Handles error messages from Blazor
     */
    private handleBlazorError(message: { type: string; data: { message: string; error?: string; source?: string; line?: number; stack?: string } }): void {
        const { data } = message;
        const errorDetails = [
            `Blazor Error: ${data.message}`,
            data.error ? `Error: ${data.error}` : '',
            data.source ? `Source: ${data.source}` : '',
            data.line ? `Line: ${data.line}` : '',
            data.stack ? `Stack:\n${data.stack}` : ''
        ].filter(Boolean).join('\n');

        // Log to output channel and show it
        this.logError('Blazor Error', errorDetails);
        
        // Show error notification
        vscode.window.showErrorMessage(
            `Kazo Design Error: ${data.message}`,
            'Show Output'
        ).then(choice => {
            if (choice === 'Show Output') {
                this.outputChannel.show(true);
            }
        });
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
     * Handles confirm sketch and return to AI assistant
     */
    private async handleConfirmSketch(message: ConfirmSketchMessage): Promise<void> {
        const { svg, json, title } = message.data;

        // Ask user if they want to save the sketch
        const saveChoice = await vscode.window.showQuickPick(
            ['Save sketch and return', 'Return without saving'],
            {
                title: 'Save your sketch?',
                placeHolder: 'Would you like to save your sketch before returning to the AI assistant?'
            }
        );

        if (saveChoice === 'Save sketch and return') {
            // Ask user for save location
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(title || 'sketch'),
                filters: {
                    'SVG Files': ['svg'],
                    'All Files': ['*']
                },
                title: 'Save Sketch'
            });

            if (saveUri) {
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
                    const markdownContent = this.createMarkdownContent(title, svgPath, undefined, json);
                    fs.writeFileSync(mdPath, markdownContent, 'utf-8');

                    vscode.window.showInformationMessage(`Sketch saved to ${basePath}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to save sketch: ${error}`);
                }
            }
        }

        // Notify the MCP tools that the sketch is complete
        const sketchManager = SketchRequestManager.getInstance();
        if (sketchManager.hasPendingRequest()) {
            sketchManager.completeSketch({
                success: true,
                title: title,
                svg: svg,
                json: json
            });
        }

        // Close the editor panel
        if (this.panel) {
            this.panel.dispose();
        }

        // Show confirmation message
        vscode.window.showInformationMessage('Sketch confirmed! You can now continue your conversation with the AI assistant.');
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
        this.log('Generating webview HTML...');
        
        // Blazor publish outputs to wwwroot subfolder
        const mediaPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'wwwroot');
        
        // Get URIs for resources
        const baseUri = webview.asWebviewUri(mediaPath);
        
        // Read the original index.html from the Blazor build (in wwwroot folder)
        const indexPath = path.join(this.extensionUri.fsPath, 'media', 'ui', 'wwwroot', 'index.html');
        
        this.log(`Looking for index.html at: ${indexPath}`);
        this.log(`Index exists: ${fs.existsSync(indexPath)}`);
        
        let htmlContent: string;
        
        if (fs.existsSync(indexPath)) {
            this.log('Found Blazor build, loading index.html...');
            htmlContent = fs.readFileSync(indexPath, 'utf-8');
            
            // Update base href for webview
            htmlContent = htmlContent.replace(
                '<base href="/" />',
                `<base href="${baseUri}/" />`
            );
            
            // Content Security Policy for webview
            const csp = `
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    style-src ${webview.cspSource} 'unsafe-inline';
                    script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval';
                    img-src ${webview.cspSource} data: blob:;
                    font-src ${webview.cspSource} data:;
                    connect-src ${webview.cspSource} https: data: blob:;
                    worker-src ${webview.cspSource} blob:;
                ">
            `;
            
            // Inject VS Code API script before other scripts
            const vscodeApiScript = `
                ${csp}
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
            
            this.log(`HTML prepared, base URI: ${baseUri}`);
            
        } else {
            // Fallback HTML when Blazor build is not available
            this.logError('Blazor build not found!', `Expected at: ${indexPath}`);
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

    /**
     * Generates a nonce for CSP
     */
    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
