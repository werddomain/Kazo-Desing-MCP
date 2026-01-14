using System.Text.Json.Serialization;

namespace KazoDesign.Editor.Models;

/// <summary>
/// Defines the type of text element.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TextType
{
    Paragraph,
    H1,
    H2,
    H3,
    H4,
    H5,
    Link
}

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

    /// <summary>
    /// Type of text element (Paragraph, Header, Link).
    /// </summary>
    public TextType TextType { get; set; } = TextType.Paragraph;

    /// <summary>
    /// URL for link text type.
    /// </summary>
    public string? LinkUrl { get; set; }

    /// <summary>
    /// Gets the display text (Name if available, otherwise Content).
    /// </summary>
    [JsonIgnore]
    public string DisplayText => !string.IsNullOrWhiteSpace(Name) ? Name : Content;

    /// <summary>
    /// Gets the computed font size based on TextType.
    /// </summary>
    [JsonIgnore]
    public double ComputedFontSize => TextType switch
    {
        TextType.H1 => 32,
        TextType.H2 => 28,
        TextType.H3 => 24,
        TextType.H4 => 20,
        TextType.H5 => 18,
        TextType.Link => FontSize,
        TextType.Paragraph => FontSize,
        _ => FontSize
    };

    /// <summary>
    /// Gets the computed font weight based on TextType.
    /// </summary>
    [JsonIgnore]
    public string ComputedFontWeight => TextType switch
    {
        TextType.H1 => "bold",
        TextType.H2 => "bold",
        TextType.H3 => "bold",
        TextType.H4 => "600",
        TextType.H5 => "600",
        _ => FontWeight
    };

    public override string ElementType => "text";

    public override bool ContainsPoint(double px, double py)
    {
        // Approximate text bounds using computed font size
        var fontSize = ComputedFontSize;
        var text = DisplayText;
        var estimatedWidth = text.Length * fontSize * 0.6;
        var estimatedHeight = fontSize * 1.2;
        return px >= X && px <= X + estimatedWidth && py >= Y - estimatedHeight && py <= Y;
    }

    protected override double GetCenterX() => X + DisplayText.Length * ComputedFontSize * 0.3;
    protected override double GetCenterY() => Y - ComputedFontSize * 0.6;
}
