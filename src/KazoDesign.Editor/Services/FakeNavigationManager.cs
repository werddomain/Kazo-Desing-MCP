using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;

namespace KazoDesign.Editor.Services;

/// <summary>
/// A fake NavigationManager for VS Code webview environment where the URL scheme
/// (vscode-webview://) is not compatible with .NET's Uri parser.
/// </summary>
public class FakeNavigationManager : NavigationManager, IHostEnvironmentNavigationManager
{
    public FakeNavigationManager()
    {
        Initialize("https://localhost/", "https://localhost/");
    }

    void IHostEnvironmentNavigationManager.Initialize(string baseUri, string uri)
    {
        // Ignore the real URIs from the browser and use our fake ones
        Initialize("https://localhost/", "https://localhost/");
    }

    protected override void NavigateToCore(string uri, NavigationOptions options)
    {
        // Navigation is not supported in VS Code webview context
        // Just ignore navigation requests
        Console.WriteLine($"[FakeNavigationManager] Navigation requested to: {uri} (ignored)");
    }
}
