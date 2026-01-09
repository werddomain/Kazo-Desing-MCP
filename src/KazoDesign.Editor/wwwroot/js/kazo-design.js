// Kazo Design JavaScript Interop
window.kazoDesign = {
    // Reference to the .NET DesignService for callbacks
    dotNetRef: null,
    
    // VS Code API reference (set by extension)
    vscodeApi: null,

    // Initialize the JS interop with a .NET reference
    initialize: function(dotNetReference) {
        window.kazoDesign.dotNetRef = dotNetReference;
        console.log('Kazo Design initialized');
        
        // Notify VS Code that Blazor is ready
        window.kazoDesign.postMessage({ type: 'ready' });
    },

    // Get SVG coordinates from mouse event
    getSvgPoint: function(svgElement, clientX, clientY) {
        const svg = svgElement;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        return [svgP.x, svgP.y];
    },

    // Load a design from JSON (called from VS Code extension)
    loadDesign: async function(json) {
        if (window.kazoDesign.dotNetRef) {
            await window.kazoDesign.dotNetRef.invokeMethodAsync('LoadDesign', json);
        }
    },

    // Export the current design (called from VS Code extension)
    exportDesign: async function() {
        if (window.kazoDesign.dotNetRef) {
            return await window.kazoDesign.dotNetRef.invokeMethodAsync('ExportDesign');
        }
        return null;
    },

    // Download SVG as file (browser mode only)
    downloadSvg: function(svgContent, filename) {
        // In VS Code, send to extension instead
        if (window.kazoDesign.isInVsCode()) {
            window.kazoDesign.saveDesign(svgContent, null, filename);
            return;
        }
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'design.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Download JSON as file (browser mode only)
    downloadJson: function(jsonContent, filename) {
        // In VS Code, send to extension instead
        if (window.kazoDesign.isInVsCode()) {
            window.kazoDesign.saveDesign(null, jsonContent, filename);
            return;
        }
        
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'design.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Check if running in VS Code webview
    isInVsCode: function() {
        return typeof acquireVsCodeApi !== 'undefined' || window.vscodeApi !== undefined;
    },

    // Post message to VS Code (when running in webview)
    postMessage: function(message) {
        if (window.vscodeApi) {
            window.vscodeApi.postMessage(message);
        } else if (typeof acquireVsCodeApi !== 'undefined') {
            const vscode = acquireVsCodeApi();
            window.vscodeApi = vscode;
            vscode.postMessage(message);
        } else {
            console.log('VS Code API not available, message:', message);
        }
    },
    
    // Save design via VS Code extension
    saveDesign: async function(svg, json, title) {
        if (!svg || !json) {
            const result = await window.kazoDesign.exportDesign();
            if (result) {
                svg = svg || result.svg;
                json = json || result.json;
                title = title || result.title;
            }
        }
        
        window.kazoDesign.postMessage({
            type: 'saveDesign',
            data: { svg, json, title }
        });
    },
    
    // Ask user for input via VS Code
    askUser: function(questionType, title, placeholder, options) {
        return new Promise((resolve) => {
            const requestId = 'req_' + Date.now();
            
            // Store resolver for callback
            window.kazoDesign._pendingRequests = window.kazoDesign._pendingRequests || {};
            window.kazoDesign._pendingRequests[requestId] = resolve;
            
            window.kazoDesign.postMessage({
                type: 'askUser',
                data: { requestId, questionType, title, placeholder, options }
            });
        });
    },
    
    // Handle messages from VS Code extension
    handleExtensionMessage: function(message) {
        switch (message.type) {
            case 'loadDesign':
                window.kazoDesign.loadDesign(message.data);
                break;
            case 'exportDesign':
                window.kazoDesign.exportDesign().then(result => {
                    window.kazoDesign.postMessage({
                        type: 'exportResult',
                        data: result
                    });
                });
                break;
            case 'userResponse':
                if (message.data && message.data.requestId) {
                    const resolver = window.kazoDesign._pendingRequests?.[message.data.requestId];
                    if (resolver) {
                        resolver(message.data.value);
                        delete window.kazoDesign._pendingRequests[message.data.requestId];
                    }
                }
                break;
        }
    },

    // Copy text to clipboard
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    }
};

// Listen for messages from VS Code extension (fallback for direct postMessage)
window.addEventListener('message', event => {
    const message = event.data;
    if (window.kazoDesign.handleExtensionMessage) {
        window.kazoDesign.handleExtensionMessage(message);
    }
});
