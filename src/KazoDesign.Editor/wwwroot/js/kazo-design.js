// Kazo Design JavaScript Interop
window.kazoDesign = {
    // Reference to the .NET DesignService for callbacks
    dotNetRef: null,

    // Initialize the JS interop with a .NET reference
    initialize: function(dotNetReference) {
        window.kazoDesign.dotNetRef = dotNetReference;
        console.log('Kazo Design initialized');
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

    // Download SVG as file
    downloadSvg: function(svgContent, filename) {
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

    // Download JSON as file
    downloadJson: function(jsonContent, filename) {
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

    // Post message to VS Code (when running in webview)
    postMessage: function(message) {
        if (typeof acquireVsCodeApi !== 'undefined') {
            const vscode = acquireVsCodeApi();
            vscode.postMessage(message);
        } else {
            console.log('VS Code API not available, message:', message);
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

// Listen for messages from VS Code extension
window.addEventListener('message', event => {
    const message = event.data;
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
    }
});
