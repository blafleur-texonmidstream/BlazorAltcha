using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace BlazorAltcha.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AltchaController : ControllerBase
{
    private static readonly Random Random = new();
    
    [HttpGet("challenge")]
    public IActionResult GetChallenge()
    {
        // Generate a random salt
        string salt = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff") + Random.Next(10000, 99999);
        
        // Generate a random number between 1 and 1000
        int number = Random.Next(1, 1000);
        
        // Calculate the challenge hash (SHA-256 of salt + number)
        string challenge = ComputeSha256Hash(salt + number.ToString());
        
        // Return the challenge data
        return Ok(new
        {
            algorithm = "SHA-256",
            challenge,
            salt,
            maxNumber = 1000,
            signature = "" // Optional signature for enterprise use
        });
    }
    
    [HttpPost("verify")]
    public IActionResult VerifyChallenge([FromBody] AltchaVerifyRequest request)
    {
        try
        {
            // Parse the payload (which contains the solution)
            var payloadData = System.Text.Json.JsonSerializer.Deserialize<AltchaPayload>(
                Encoding.UTF8.GetString(Convert.FromBase64String(request.Payload)));
                
            if (payloadData == null)
            {
                return BadRequest(new { verified = false, reason = "Invalid payload" });
            }
            
            // Verify the challenge solution is correct
            bool isValid = VerifySolution(payloadData);
            
            if (!isValid)
            {
                return Ok(new { verified = false, reason = "Incorrect solution" });
            }
            
            return Ok(new { verified = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { verified = false, reason = ex.Message });
        }
    }
    
    private bool VerifySolution(AltchaPayload payload)
    {
        // For production, you should disable test mode entirely
        // This commented code is only for development
        // if (payload.Test == true)
        // {
        //     return true;
        // }
        
        // Check if the solution (number) produces the expected challenge hash
        string computedHash = ComputeSha256Hash(payload.Salt + payload.Number.ToString());
        
        // Compare the computed hash with the challenge hash
        return string.Equals(computedHash, payload.Challenge, StringComparison.OrdinalIgnoreCase);
    }
    
    private static string ComputeSha256Hash(string text)
    {
        using var sha256 = SHA256.Create();
        byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(text));
        
        var builder = new StringBuilder();
        foreach (byte b in bytes)
        {
            builder.Append(b.ToString("x2"));
        }
        return builder.ToString();
    }
}

public class AltchaVerifyRequest
{
    public string Payload { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

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
