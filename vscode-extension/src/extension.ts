import * as vscode from 'vscode';
import { KazoDesignEditorProvider } from './kazoDesignEditorProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Kazo Design MCP extension is now active');

    // Register the custom editor provider
    const provider = new KazoDesignEditorProvider(context);

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
}

export function deactivate() {
    console.log('Kazo Design MCP extension is now deactivated');
}
