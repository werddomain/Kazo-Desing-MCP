namespace KazoDesign.Editor.Models;

/// <summary>
/// Represents a line shape on the canvas.
/// </summary>
public class KLine : DesignElement
{
    /// <summary>
    /// End X coordinate of the line.
    /// </summary>
    public double X2 { get; set; } = 100;

    /// <summary>
    /// End Y coordinate of the line.
    /// </summary>
    public double Y2 { get; set; } = 100;

    /// <summary>
    /// Stroke color of the line.
    /// </summary>
    public string Stroke { get; set; } = "#f0ad4e";

    /// <summary>
    /// Stroke width of the line.
    /// </summary>
    public double StrokeWidth { get; set; } = 3;

    /// <summary>
    /// Dash pattern for the line (e.g., "5,5" for dashed).
    /// </summary>
    public string? StrokeDashArray { get; set; }

    public override string ElementType => "line";

    public override bool ContainsPoint(double px, double py)
    {
        // Calculate distance from point to line segment
        var tolerance = Math.Max(StrokeWidth * 2, 10);
        var dist = DistanceToLineSegment(px, py, X, Y, X2, Y2);
        return dist <= tolerance;
    }

    private static double DistanceToLineSegment(double px, double py, double x1, double y1, double x2, double y2)
    {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var lengthSq = dx * dx + dy * dy;

        if (lengthSq == 0)
            return Math.Sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));

        var t = Math.Max(0, Math.Min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
        var projX = x1 + t * dx;
        var projY = y1 + t * dy;

        return Math.Sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    }

    protected override double GetCenterX() => (X + X2) / 2;
    protected override double GetCenterY() => (Y + Y2) / 2;
}
