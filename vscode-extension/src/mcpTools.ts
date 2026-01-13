import * as vscode from 'vscode';

/**
 * Result from the sketch tool
 */
interface SketchResult {
    success: boolean;
    title?: string;
    svg?: string;
    json?: string;
    prompt?: string;
    error?: string;
}

/**
 * Generic result for user prompt tools
 */
interface UserPromptResult {
    success: boolean;
    value?: string;
    values?: string[];
    filePath?: string;
    filePaths?: string[];
    error?: string;
    cancelled?: boolean;
}

/**
 * Pending sketch request that waits for user to complete a sketch
 */
interface PendingSketchRequest {
    resolve: (result: SketchResult) => void;
    reject: (error: Error) => void;
    title: string;
    prompt: string;
}

/**
 * Manages pending sketch requests from AI assistants
 */
export class SketchRequestManager {
    private static instance: SketchRequestManager;
    private pendingRequest: PendingSketchRequest | null = null;

    public static getInstance(): SketchRequestManager {
        if (!SketchRequestManager.instance) {
            SketchRequestManager.instance = new SketchRequestManager();
        }
        return SketchRequestManager.instance;
    }

    /**
     * Create a new sketch request and wait for user to complete it
     */
    public async requestSketch(title: string, prompt: string): Promise<SketchResult> {
        if (this.pendingRequest) {
            // Cancel existing request
            this.pendingRequest.reject(new Error('New sketch request started'));
            this.pendingRequest = null;
        }

        return new Promise((resolve, reject) => {
            this.pendingRequest = { resolve, reject, title, prompt };
        });
    }

    /**
     * Complete the pending sketch request with the result
     */
    public completeSketch(result: SketchResult): void {
        if (this.pendingRequest) {
            this.pendingRequest.resolve(result);
            this.pendingRequest = null;
        }
    }

    /**
     * Cancel the pending sketch request
     */
    public cancelSketch(): void {
        if (this.pendingRequest) {
            this.pendingRequest.resolve({
                success: false,
                error: 'User cancelled the sketch'
            });
            this.pendingRequest = null;
        }
    }

    /**
     * Check if there's a pending request
     */
    public hasPendingRequest(): boolean {
        return this.pendingRequest !== null;
    }

    /**
     * Get the pending request details
     */
    public getPendingRequest(): { title: string; prompt: string } | null {
        if (this.pendingRequest) {
            return {
                title: this.pendingRequest.title,
                prompt: this.pendingRequest.prompt
            };
        }
        return null;
    }
}

/**
 * Tool for requesting a design sketch from the user
 * 
 * This tool opens the Kazo Design editor and waits for the user to create a sketch.
 * The sketch can then be used by the AI to understand the user's design intentions.
 */
export class RequestSketchTool implements vscode.LanguageModelTool<{ title?: string; prompt?: string }> {
    
    constructor(private openEditorCommand: () => void) {}

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<{ title?: string; prompt?: string }>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const title = options.input.title || 'Design Sketch';
        const prompt = options.input.prompt || 'Please create a sketch of your design idea';

        // Show notification to user
        const startSketch = await vscode.window.showInformationMessage(
            `🎨 The AI assistant would like you to create a sketch: "${title}"`,
            { modal: false },
            'Open Sketch Editor',
            'Skip'
        );

        if (startSketch !== 'Open Sketch Editor') {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: false,
                    error: 'User declined to create a sketch'
                }))
            ]);
        }

        // Open the editor
        this.openEditorCommand();

        // Create a pending request
        const manager = SketchRequestManager.getInstance();
        
        // Set up cancellation
        const cancellationPromise = new Promise<SketchResult>((_, reject) => {
            token.onCancellationRequested(() => {
                manager.cancelSketch();
                reject(new Error('Request was cancelled'));
            });
        });

        try {
            // Wait for user to complete the sketch or cancel
            const result = await Promise.race([
                manager.requestSketch(title, prompt),
                cancellationPromise
            ]);

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(result))
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }))
            ]);
        }
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationOptions<{ title?: string; prompt?: string }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const title = options.input.title || 'Design Sketch';
        return {
            invocationMessage: `Requesting sketch: "${title}"`,
            confirmationMessages: {
                title: 'Create Design Sketch',
                message: new vscode.MarkdownString(
                    `The AI assistant would like you to create a design sketch.\n\n` +
                    `**Title:** ${title}\n\n` +
                    `This will open the Kazo Design editor where you can draw your idea.`
                )
            }
        };
    }
}

/**
 * Tool for asking user to select from a list of options
 * Can optionally allow the user to respond with a sketch instead
 */
export class SelectOptionTool implements vscode.LanguageModelTool<{ 
    title: string; 
    options: string[]; 
    placeholder?: string;
    canSelectMany?: boolean;
    allowSketch?: boolean;
    sketchPrompt?: string;
}> {
    
    constructor(private openEditorCommand: () => void) {}

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            options: string[]; 
            placeholder?: string;
            canSelectMany?: boolean;
            allowSketch?: boolean;
            sketchPrompt?: string;
        }>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { title, options: choices, placeholder, canSelectMany, allowSketch, sketchPrompt } = options.input;

        if (!choices || choices.length === 0) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: false,
                    error: 'No options provided'
                } as UserPromptResult))
            ]);
        }

        // Add sketch option if allowed
        const SKETCH_OPTION = '🎨 Reply with a sketch...';
        const allChoices = allowSketch ? [...choices, SKETCH_OPTION] : choices;

        try {
            if (canSelectMany && !allowSketch) {
                // Multi-select mode (sketch not supported in multi-select)
                const selected = await vscode.window.showQuickPick(choices, {
                    title: title,
                    placeHolder: placeholder || 'Select one or more options',
                    canPickMany: true
                });

                if (selected === undefined) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify({
                            success: false,
                            cancelled: true,
                            error: 'User cancelled selection'
                        } as UserPromptResult))
                    ]);
                }

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        success: true,
                        values: selected
                    } as UserPromptResult))
                ]);
            } else {
                // Single select mode (with optional sketch)
                const selected = await vscode.window.showQuickPick(allChoices, {
                    title: title,
                    placeHolder: placeholder || 'Select an option'
                });

                if (selected === undefined) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify({
                            success: false,
                            cancelled: true,
                            error: 'User cancelled selection'
                        } as UserPromptResult))
                    ]);
                }

                // User chose to reply with a sketch
                if (selected === SKETCH_OPTION) {
                    // Open the editor
                    this.openEditorCommand();

                    // Create a pending sketch request
                    const manager = SketchRequestManager.getInstance();
                    
                    // Set up cancellation
                    const cancellationPromise = new Promise<SketchResult>((_, reject) => {
                        token.onCancellationRequested(() => {
                            manager.cancelSketch();
                            reject(new Error('Request was cancelled'));
                        });
                    });

                    try {
                        const sketchResult = await Promise.race([
                            manager.requestSketch(title, sketchPrompt || 'Draw your response'),
                            cancellationPromise
                        ]);

                        return new vscode.LanguageModelToolResult([
                            new vscode.LanguageModelTextPart(JSON.stringify({
                                success: true,
                                responseType: 'sketch',
                                sketch: sketchResult
                            }))
                        ]);
                    } catch (error) {
                        return new vscode.LanguageModelToolResult([
                            new vscode.LanguageModelTextPart(JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown error'
                            }))
                        ]);
                    }
                }

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        success: true,
                        responseType: 'selection',
                        value: selected
                    } as UserPromptResult))
                ]);
            }
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                } as UserPromptResult))
            ]);
        }
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            options: string[]; 
            placeholder?: string;
            canSelectMany?: boolean;
            allowSketch?: boolean;
            sketchPrompt?: string;
        }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const optionsList = options.input.options?.slice(0, 5).join(', ') || '';
        const more = (options.input.options?.length || 0) > 5 ? '...' : '';
        const sketchNote = options.input.allowSketch ? '\n\n*You can also reply with a sketch*' : '';
        return {
            invocationMessage: `Asking user to select: ${options.input.title}`,
            confirmationMessages: {
                title: 'Select Option',
                message: new vscode.MarkdownString(
                    `The AI assistant is asking you to choose from options.\n\n` +
                    `**${options.input.title}**\n\n` +
                    `Options: ${optionsList}${more}${sketchNote}`
                )
            }
        };
    }
}

/**
 * Tool for asking user to input custom text
 */
export class RequestTextInputTool implements vscode.LanguageModelTool<{ 
    title: string; 
    prompt?: string;
    placeholder?: string;
    defaultValue?: string;
    password?: boolean;
}> {
    
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            prompt?: string;
            placeholder?: string;
            defaultValue?: string;
            password?: boolean;
        }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { title, prompt, placeholder, defaultValue, password } = options.input;

        try {
            const result = await vscode.window.showInputBox({
                title: title,
                prompt: prompt || title,
                placeHolder: placeholder,
                value: defaultValue,
                password: password || false
            });

            if (result === undefined) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        success: false,
                        cancelled: true,
                        error: 'User cancelled input'
                    } as UserPromptResult))
                ]);
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: true,
                    value: result
                } as UserPromptResult))
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                } as UserPromptResult))
            ]);
        }
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            prompt?: string;
            placeholder?: string;
            defaultValue?: string;
            password?: boolean;
        }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: `Asking user: ${options.input.title}`,
            confirmationMessages: {
                title: 'Text Input Required',
                message: new vscode.MarkdownString(
                    `The AI assistant needs your input.\n\n` +
                    `**${options.input.title}**\n\n` +
                    (options.input.prompt ? `${options.input.prompt}` : '')
                )
            }
        };
    }
}

/**
 * Tool for asking user to select a file
 */
export class SelectFileTool implements vscode.LanguageModelTool<{ 
    title: string; 
    canSelectMany?: boolean;
    canSelectFolders?: boolean;
    filters?: { [name: string]: string[] };
    defaultUri?: string;
}> {
    
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            canSelectMany?: boolean;
            canSelectFolders?: boolean;
            filters?: { [name: string]: string[] };
            defaultUri?: string;
        }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { title, canSelectMany, canSelectFolders, filters, defaultUri } = options.input;

        try {
            const uris = await vscode.window.showOpenDialog({
                title: title,
                canSelectMany: canSelectMany || false,
                canSelectFolders: canSelectFolders || false,
                canSelectFiles: !canSelectFolders,
                filters: filters,
                defaultUri: defaultUri ? vscode.Uri.file(defaultUri) : undefined
            });

            if (!uris || uris.length === 0) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        success: false,
                        cancelled: true,
                        error: 'User cancelled file selection'
                    } as UserPromptResult))
                ]);
            }

            if (canSelectMany) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        success: true,
                        filePaths: uris.map(uri => uri.fsPath)
                    } as UserPromptResult))
                ]);
            } else {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        success: true,
                        filePath: uris[0].fsPath
                    } as UserPromptResult))
                ]);
            }
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                } as UserPromptResult))
            ]);
        }
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            canSelectMany?: boolean;
            canSelectFolders?: boolean;
            filters?: { [name: string]: string[] };
            defaultUri?: string;
        }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const type = options.input.canSelectFolders ? 'folder' : 'file';
        return {
            invocationMessage: `Asking user to select a ${type}: ${options.input.title}`,
            confirmationMessages: {
                title: `Select ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                message: new vscode.MarkdownString(
                    `The AI assistant needs you to select a ${type}.\n\n` +
                    `**${options.input.title}**`
                )
            }
        };
    }
}

/**
 * Tool for asking user to confirm an action (Yes/No)
 */
export class ConfirmActionTool implements vscode.LanguageModelTool<{ 
    title: string; 
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}> {
    
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            message: string;
            confirmLabel?: string;
            cancelLabel?: string;
        }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { title, message, confirmLabel, cancelLabel } = options.input;

        try {
            const result = await vscode.window.showInformationMessage(
                message,
                { modal: true, detail: title },
                confirmLabel || 'Yes',
                cancelLabel || 'No'
            );

            const confirmed = result === (confirmLabel || 'Yes');

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: true,
                    value: confirmed ? 'confirmed' : 'declined',
                    confirmed: confirmed
                }))
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                } as UserPromptResult))
            ]);
        }
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationOptions<{ 
            title: string; 
            message: string;
            confirmLabel?: string;
            cancelLabel?: string;
        }>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: `Asking user to confirm: ${options.input.title}`,
            confirmationMessages: {
                title: 'Confirmation Required',
                message: new vscode.MarkdownString(
                    `The AI assistant needs your confirmation.\n\n` +
                    `**${options.input.title}**\n\n` +
                    `${options.input.message}`
                )
            }
        };
    }
}

/**
 * Tool for getting information about the Kazo Design extension capabilities
 */
export class GetCapabilitiesTool implements vscode.LanguageModelTool<Record<string, never>> {
    
    async invoke(
        _options: vscode.LanguageModelToolInvocationOptions<Record<string, never>>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const capabilities = {
            name: 'Kazo Design',
            description: 'A visual design tool for communicating UI/UX ideas through quick sketches, with user interaction capabilities',
            availableShapes: ['rectangle', 'circle', 'line', 'text', 'image'],
            features: [
                'Create rectangles for layouts, containers, buttons',
                'Create circles for icons, avatars, decorations',
                'Draw lines for connections, separators',
                'Add text labels to explain parts of the sketch',
                'Export as SVG and JSON',
                'Grid overlay for alignment',
                'Drag and drop positioning'
            ],
            outputFormats: ['SVG', 'JSON', 'Markdown'],
            userInteractionTools: [
                {
                    name: 'kazo_request_sketch',
                    description: 'Ask user to create a visual sketch/mockup'
                },
                {
                    name: 'kazo_select_option',
                    description: 'Present options for user to choose from'
                },
                {
                    name: 'kazo_request_text',
                    description: 'Ask user for text input'
                },
                {
                    name: 'kazo_select_file',
                    description: 'Ask user to select a file or folder'
                },
                {
                    name: 'kazo_confirm_action',
                    description: 'Ask user to confirm an action (Yes/No)'
                }
            ]
        };

        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(JSON.stringify(capabilities, null, 2))
        ]);
    }

    async prepareInvocation(
        _options: vscode.LanguageModelToolInvocationOptions<Record<string, never>>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: 'Getting Kazo Design capabilities...'
        };
    }
}

/**
 * Register all MCP tools with VS Code
 */
export function registerMcpTools(
    context: vscode.ExtensionContext,
    openEditorCommand: () => void
): void {
    // Register the request sketch tool
    const requestSketchTool = new RequestSketchTool(openEditorCommand);
    context.subscriptions.push(
        vscode.lm.registerTool('kazo_request_sketch', requestSketchTool)
    );

    // Register the select option tool (with sketch support)
    const selectOptionTool = new SelectOptionTool(openEditorCommand);
    context.subscriptions.push(
        vscode.lm.registerTool('kazo_select_option', selectOptionTool)
    );

    // Register the text input tool
    const requestTextTool = new RequestTextInputTool();
    context.subscriptions.push(
        vscode.lm.registerTool('kazo_request_text', requestTextTool)
    );

    // Register the file selection tool
    const selectFileTool = new SelectFileTool();
    context.subscriptions.push(
        vscode.lm.registerTool('kazo_select_file', selectFileTool)
    );

    // Register the confirmation tool
    const confirmActionTool = new ConfirmActionTool();
    context.subscriptions.push(
        vscode.lm.registerTool('kazo_confirm_action', confirmActionTool)
    );

    // Register the capabilities tool
    const capabilitiesTool = new GetCapabilitiesTool();
    context.subscriptions.push(
        vscode.lm.registerTool('kazo_get_capabilities', capabilitiesTool)
    );

    console.log('Kazo Design MCP tools registered');
}
