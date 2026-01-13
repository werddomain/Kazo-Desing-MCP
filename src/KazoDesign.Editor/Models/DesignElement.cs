using System.Text.Json.Serialization;

namespace KazoDesign.Editor.Models;

/// <summary>
/// Abstract base class for all design elements on the canvas.
/// </summary>
[JsonDerivedType(typeof(KRectangle), "rectangle")]
[JsonDerivedType(typeof(KCircle), "circle")]
[JsonDerivedType(typeof(KLine), "line")]
[JsonDerivedType(typeof(KText), "text")]
[JsonDerivedType(typeof(KImage), "image")]
public abstract class DesignElement
{
    /// <summary>
    /// Unique identifier for the element.
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// X position of the element on the canvas.
    /// </summary>
    public double X { get; set; }

    /// <summary>
    /// Y position of the element on the canvas.
    /// </summary>
    public double Y { get; set; }

    /// <summary>
    /// Rotation angle in degrees.
    /// </summary>
    public double Rotation { get; set; }

    /// <summary>
    /// Name of the element (used for identification in exports).
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Description or metadata for the element.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Whether the element is currently selected.
    /// </summary>
    [JsonIgnore]
    public bool IsSelected { get; set; }

    /// <summary>
    /// Gets the type name for serialization.
    /// </summary>
    public abstract string ElementType { get; }

    /// <summary>
    /// Checks if a point is within the element bounds.
    /// </summary>
    public abstract bool ContainsPoint(double px, double py);

    /// <summary>
    /// Gets the SVG transform string for the element.
    /// </summary>
    public string GetTransform()
    {
        if (Rotation == 0)
            return string.Empty;
        return $"rotate({Rotation} {GetCenterX()} {GetCenterY()})";
    }

    /// <summary>
    /// Gets the center X coordinate of the element.
    /// </summary>
    protected abstract double GetCenterX();

    /// <summary>
    /// Gets the center Y coordinate of the element.
    /// </summary>
    protected abstract double GetCenterY();
}
