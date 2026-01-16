using System.Text.Json;
using KazoDesign.Editor.Models;
using Microsoft.JSInterop;

namespace KazoDesign.Editor.Services;

/// <summary>
/// Drawing tool mode for the canvas.
/// </summary>
public enum DrawingTool
{
    Select,
    Rectangle,
    Circle,
    Line,
    Text
}

/// <summary>
/// Service for managing the design state and providing JSInterop methods.
/// </summary>
public class DesignService
{
    private readonly IJSRuntime _jsRuntime;
    
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };
    
    public DesignDocument Document { get; private set; } = new();
    
    public DesignElement? SelectedElement { get; private set; }
    
    /// <summary>
    /// Current drawing tool selected.
    /// </summary>
    public DrawingTool CurrentTool { get; set; } = DrawingTool.Select;
    
    /// <summary>
    /// Flag to indicate that the properties dialog should be shown (set on double-click).
    /// </summary>
    public bool ShouldShowPropertiesDialog { get; set; }
    
    /// <summary>
    /// Current view context. Null means root level, otherwise contains the name of the View element being edited.
    /// </summary>
    public string? CurrentViewContext { get; private set; }
    
    /// <summary>
    /// Gets the list of parent views (breadcrumb path from root to current view).
    /// </summary>
    public List<string> ViewBreadcrumb { get; private set; } = new();
    
    public event Action? OnChange;
    
    public DesignService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
    }
    
    public void NotifyStateChanged()
    {
        Document.ModifiedAt = DateTime.UtcNow;
        OnChange?.Invoke();
    }
    
    public void SelectElement(DesignElement? element)
    {
        if (SelectedElement != null)
        {
            SelectedElement.IsSelected = false;
        }
        
        SelectedElement = element;
        
        if (SelectedElement != null)
        {
            SelectedElement.IsSelected = true;
        }
        
        OnChange?.Invoke();
    }
    
    public void AddElement(DesignElement element)
    {
        // Set the parent to current view context if we're inside a view
        element.Parent = CurrentViewContext;
        Document.Elements.Add(element);
        SelectElement(element);
        NotifyStateChanged();
    }
    
    public void RemoveElement(DesignElement element)
    {
        Document.Elements.Remove(element);
        if (SelectedElement == element)
        {
            SelectElement(null);
        }
        NotifyStateChanged();
    }
    
    public void ClearCanvas()
    {
        // Only clear elements in the current view context
        var elementsToRemove = Document.Elements.Where(e => e.Parent == CurrentViewContext).ToList();
        foreach (var element in elementsToRemove)
        {
            Document.Elements.Remove(element);
        }
        SelectElement(null);
        NotifyStateChanged();
    }
    
    /// <summary>
    /// Gets elements that belong to the current view context.
    /// </summary>
    public IEnumerable<DesignElement> GetCurrentViewElements()
    {
        return Document.Elements.Where(e => e.Parent == CurrentViewContext);
    }
    
    /// <summary>
    /// Enters into a View element to edit its contents.
    /// </summary>
    public void EnterView(string viewName)
    {
        // Find the view element
        var viewElement = Document.Elements.FirstOrDefault(e => e.Name == viewName && e.Meaning == ElementMeaning.View);
        if (viewElement == null)
            return;
            
        // Add current context to breadcrumb if not null
        if (CurrentViewContext != null)
        {
            ViewBreadcrumb.Add(CurrentViewContext);
        }
        
        CurrentViewContext = viewName;
        SelectElement(null);
        NotifyStateChanged();
    }
    
    /// <summary>
    /// Navigates back to the parent view or root.
    /// </summary>
    public void ExitToParentView()
    {
        if (ViewBreadcrumb.Count > 0)
        {
            CurrentViewContext = ViewBreadcrumb[^1];
            ViewBreadcrumb.RemoveAt(ViewBreadcrumb.Count - 1);
        }
        else
        {
            CurrentViewContext = null;
        }
        SelectElement(null);
        NotifyStateChanged();
    }
    
    /// <summary>
    /// Navigates back to the root level.
    /// </summary>
    public void ExitToRoot()
    {
        CurrentViewContext = null;
        ViewBreadcrumb.Clear();
        SelectElement(null);
        NotifyStateChanged();
    }
    
    /// <summary>
    /// Checks if the selected element is a View that can be entered.
    /// </summary>
    public bool CanEnterSelectedView()
    {
        return SelectedElement != null && SelectedElement.Meaning == ElementMeaning.View && !string.IsNullOrWhiteSpace(SelectedElement.Name);
    }
    
    /// <summary>
    /// Gets child elements of a View element for rendering preview.
    /// </summary>
    public IEnumerable<DesignElement> GetViewChildElements(string viewName)
    {
        return Document.Elements.Where(e => e.Parent == viewName);
    }
    
    /// <summary>
    /// Loads a design from JSON. Called from JavaScript.
    /// </summary>
    [JSInvokable]
    public Task LoadDesign(string json)
    {
        try
        {
            var document = JsonSerializer.Deserialize<DesignDocument>(json, JsonOptions);
            if (document != null)
            {
                Document = document;
                SelectElement(null);
                NotifyStateChanged();
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error loading design: {ex.Message}");
        }
        
        return Task.CompletedTask;
    }
    
    /// <summary>
    /// Sets the MCP context from an AI assistant request.
    /// Called from JavaScript when VS Code sends mcpContext message.
    /// </summary>
    [JSInvokable]
    public Task SetMcpContext(string title, string prompt)
    {
        Console.WriteLine($"Setting MCP context: title='{title}', prompt='{prompt}'");
        
        // Set the document title and prompt from the AI request
        if (!string.IsNullOrWhiteSpace(title))
        {
            Document.Title = title;
        }
        
        if (!string.IsNullOrWhiteSpace(prompt))
        {
            Document.Prompt = prompt;
        }
        
        NotifyStateChanged();
        return Task.CompletedTask;
    }
    
    /// <summary>
    /// Exports the current design. Can be called from JavaScript.
    /// </summary>
    [JSInvokable]
    public Task<ExportResult> ExportDesign()
    {
        return Task.FromResult(ExportDesignSync());
    }
    
    /// <summary>
    /// Exports the current design synchronously.
    /// </summary>
    public ExportResult ExportDesignSync()
    {
        var svgContent = GenerateSvg();
        var jsonData = JsonSerializer.Serialize(Document, JsonOptions);
        
        return new ExportResult
        {
            Svg = svgContent,
            Json = jsonData,
            Title = Document.Title,
            Description = Document.Description,
            Prompt = Document.Prompt,
            AiContext = Document.AiContext
        };
    }
    
    /// <summary>
    /// Generates the SVG markup for the current design.
    /// </summary>
    public string GenerateSvg()
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{Document.CanvasWidth}\" height=\"{Document.CanvasHeight}\" viewBox=\"0 0 {Document.CanvasWidth} {Document.CanvasHeight}\">");
        sb.AppendLine($"  <rect width=\"100%\" height=\"100%\" fill=\"{Document.BackgroundColor}\" />");
        
        foreach (var element in Document.Elements)
        {
            var svg = element switch
            {
                KRectangle r => GenerateRectSvg(r),
                KCircle c => GenerateCircleSvg(c),
                KLine l => GenerateLineSvg(l),
                KText t => GenerateTextSvg(t),
                KImage i => GenerateImageSvg(i),
                _ => string.Empty
            };
            
            if (!string.IsNullOrEmpty(svg))
            {
                sb.AppendLine($"  {svg}");
            }
        }
        
        sb.AppendLine("</svg>");
        return sb.ToString();
    }
    
    private static string GenerateRectSvg(KRectangle r)
    {
        var transform = !string.IsNullOrEmpty(r.GetTransform()) ? $" transform=\"{r.GetTransform()}\"" : "";
        var rx = r.CornerRadius > 0 ? $" rx=\"{r.CornerRadius}\" ry=\"{r.CornerRadius}\"" : "";
        return $"<rect id=\"{r.Id}\" x=\"{r.X}\" y=\"{r.Y}\" width=\"{r.Width}\" height=\"{r.Height}\"{rx} fill=\"{r.Fill}\" stroke=\"{r.Stroke}\" stroke-width=\"{r.StrokeWidth}\"{transform} />";
    }
    
    private static string GenerateCircleSvg(KCircle c)
    {
        var transform = !string.IsNullOrEmpty(c.GetTransform()) ? $" transform=\"{c.GetTransform()}\"" : "";
        return $"<circle id=\"{c.Id}\" cx=\"{c.X}\" cy=\"{c.Y}\" r=\"{c.Radius}\" fill=\"{c.Fill}\" stroke=\"{c.Stroke}\" stroke-width=\"{c.StrokeWidth}\"{transform} />";
    }
    
    private static string GenerateLineSvg(KLine l)
    {
        var transform = !string.IsNullOrEmpty(l.GetTransform()) ? $" transform=\"{l.GetTransform()}\"" : "";
        var dashArray = !string.IsNullOrEmpty(l.StrokeDashArray) ? $" stroke-dasharray=\"{l.StrokeDashArray}\"" : "";
        return $"<line id=\"{l.Id}\" x1=\"{l.X}\" y1=\"{l.Y}\" x2=\"{l.X2}\" y2=\"{l.Y2}\" stroke=\"{l.Stroke}\" stroke-width=\"{l.StrokeWidth}\"{dashArray}{transform} />";
    }
    
    private static string GenerateTextSvg(KText t)
    {
        var transform = !string.IsNullOrEmpty(t.GetTransform()) ? $" transform=\"{t.GetTransform()}\"" : "";
        return $"<text id=\"{t.Id}\" x=\"{t.X}\" y=\"{t.Y}\" font-size=\"{t.FontSize}\" font-family=\"{t.FontFamily}\" font-weight=\"{t.FontWeight}\" fill=\"{t.Fill}\"{transform}>{System.Security.SecurityElement.Escape(t.Content)}</text>";
    }
    
    private static string GenerateImageSvg(KImage i)
    {
        var transform = !string.IsNullOrEmpty(i.GetTransform()) ? $" transform=\"{i.GetTransform()}\"" : "";
        var preserveRatio = i.PreserveAspectRatio ? " preserveAspectRatio=\"xMidYMid meet\"" : "";
        return $"<image id=\"{i.Id}\" x=\"{i.X}\" y=\"{i.Y}\" width=\"{i.Width}\" height=\"{i.Height}\" href=\"{i.Source}\"{preserveRatio}{transform} />";
    }
    
    /// <summary>
    /// Adds sample shapes to the canvas for testing.
    /// </summary>
    public void AddSampleShapes()
    {
        AddElement(new KRectangle 
        { 
            X = 50, 
            Y = 50, 
            Width = 120, 
            Height = 80, 
            Fill = "#4a90d9",
            Description = "Blue rectangle shape"
        });
        
        AddElement(new KCircle 
        { 
            X = 300, 
            Y = 100, 
            Radius = 50, 
            Fill = "#5cb85c",
            Description = "Green circle shape"
        });
        
        AddElement(new KLine 
        { 
            X = 400, 
            Y = 50, 
            X2 = 550, 
            Y2 = 150, 
            Stroke = "#f0ad4e",
            StrokeWidth = 3,
            Description = "Orange diagonal line"
        });
        
        AddElement(new KText 
        { 
            X = 50, 
            Y = 200, 
            Content = "Kazo Design Editor", 
            FontSize = 24,
            Fill = "#e0e0e0",
            Description = "Title text"
        });
        
        AddElement(new KRectangle 
        { 
            X = 50, 
            Y = 250, 
            Width = 150, 
            Height = 100, 
            Fill = "#d9534f",
            CornerRadius = 10,
            Description = "Red rounded rectangle"
        });
        
        Document.Title = "Sample Design";
        SelectElement(null);
        NotifyStateChanged();
    }
}

/// <summary>
/// Result of exporting a design.
/// </summary>
public class ExportResult
{
    public string Svg { get; set; } = string.Empty;
    public string Json { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Prompt { get; set; }
    public string? AiContext { get; set; }
}
