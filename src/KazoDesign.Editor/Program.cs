using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using KazoDesign.Editor;
using KazoDesign.Editor.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
// HeadOutlet removed - it uses NavigationManager which fails with vscode-webview:// URIs

// Replace the default NavigationManager with our fake one that doesn't parse vscode-webview:// URIs
builder.Services.AddScoped<NavigationManager, FakeNavigationManager>();

// Note: HttpClient is not used in VS Code webview context, but we register it
// with a placeholder URL to satisfy any dependencies that might require it
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri("https://localhost/") });
builder.Services.AddScoped<DesignService>();

await builder.Build().RunAsync();
