import * as vscode from 'vscode';
import { KazoDesignEditorProvider } from './kazoDesignEditorProvider';
import { registerMcpTools } from './mcpTools';

// Shared output channel for the extension
export let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    // Create output channel first
    outputChannel = vscode.window.createOutputChannel('Kazo Design');
    context.subscriptions.push(outputChannel);
    
    outputChannel.appendLine('Kazo Design MCP extension is now active');
    outputChannel.appendLine(`Extension path: ${context.extensionUri.fsPath}`);

    // Register the custom editor provider
    const provider = new KazoDesignEditorProvider(context, outputChannel);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('kazoDesign.openEditor', () => {
            provider.openNewEditor();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('kazoDesign.newDesign', () => {
            provider.openNewEditor();
        })
    );

    // Register the webview panel serializer for persistence
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(KazoDesignEditorProvider.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: unknown) {
                provider.revivePanel(webviewPanel, state);
            }
        });
    }

    // Register MCP tools for AI assistant integration
    registerMcpTools(context, () => provider.openNewEditor());

    outputChannel.appendLine('Kazo Design MCP tools registered for AI assistant integration');
}

export function deactivate() {
    console.log('Kazo Design MCP extension is now deactivated');
}
