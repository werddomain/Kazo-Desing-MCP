namespace KazoDesign.Editor.Models;

/// <summary>
/// Represents a text element on the canvas.
/// </summary>
public class KText : DesignElement
{
    /// <summary>
    /// The text content to display.
    /// </summary>
    public string Content { get; set; } = "Text";

    /// <summary>
    /// Font size in pixels.
    /// </summary>
    public double FontSize { get; set; } = 16;

    /// <summary>
    /// Font family name.
    /// </summary>
    public string FontFamily { get; set; } = "Arial, sans-serif";

    /// <summary>
    /// Text fill color.
    /// </summary>
    public string Fill { get; set; } = "#e0e0e0";

    /// <summary>
    /// Font weight (normal, bold, etc.).
    /// </summary>
    public string FontWeight { get; set; } = "normal";

    public override string ElementType => "text";

    public override bool ContainsPoint(double px, double py)
    {
        // Approximate text bounds
        var estimatedWidth = Content.Length * FontSize * 0.6;
        var estimatedHeight = FontSize * 1.2;
        return px >= X && px <= X + estimatedWidth && py >= Y - estimatedHeight && py <= Y;
    }

    protected override double GetCenterX() => X + Content.Length * FontSize * 0.3;
    protected override double GetCenterY() => Y - FontSize * 0.6;
}
