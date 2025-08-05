namespace BlazorAltcha.Models;

public class AltchaPayload
{
    public string Algorithm { get; set; } = string.Empty;
    public string Challenge { get; set; } = string.Empty;
    public int Number { get; set; }
    public string Salt { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public int Took { get; set; }
    public bool? Test { get; set; }
}
