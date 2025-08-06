using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BlazorAltcha.Models;
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
            Console.WriteLine("Verification request received");
            
            // Parse the payload (which contains the solution)
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            var payloadData = JsonSerializer.Deserialize<AltchaPayload>(
                Encoding.UTF8.GetString(Convert.FromBase64String(request.Payload)), jsonOptions);
                
            if (payloadData == null)
            {
                Console.WriteLine("Verification failed: Invalid payload");
                return BadRequest(new { verified = false, reason = "Invalid payload" });
            }
            
            // Log details about the payload for debugging
            Console.WriteLine($"Payload details: Test={payloadData.Test}, Number={payloadData.Number}, Salt={payloadData.Salt}");
            
            // Verify the challenge solution is correct
            bool isValid = VerifySolution(payloadData);
            
            if (!isValid)
            {
                Console.WriteLine("Verification failed: Incorrect solution");
                return Ok(new { verified = false, reason = "Incorrect solution" });
            }
            
            Console.WriteLine("Verification successful");
            return Ok(new { verified = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Verification error: {ex.Message}");
            return BadRequest(new { verified = false, reason = ex.Message });
        }
    }
    
    private bool VerifySolution(AltchaPayload payload)
    {
        // For testing purposes, we'll log when Test mode is detected
        if (payload.Test == true)
        {
            Console.WriteLine("TEST MODE DETECTED - Verification is being bypassed for testing");
            // In test mode, we'll bypass verification and return true
            return true;
        }
        
        // Check if the solution (number) produces the expected challenge hash
        string computedHash = ComputeSha256Hash(payload.Salt + payload.Number.ToString());
        
        // Log verification details
        Console.WriteLine($"Verification details:");
        Console.WriteLine($"  - Salt: {payload.Salt}");
        Console.WriteLine($"  - Number: {payload.Number}");
        Console.WriteLine($"  - Expected challenge hash: {payload.Challenge}");
        Console.WriteLine($"  - Computed hash: {computedHash}");
        
        // Compare the computed hash with the challenge hash
        bool isValid = string.Equals(computedHash, payload.Challenge, StringComparison.OrdinalIgnoreCase);
        Console.WriteLine($"  - Hash match: {isValid}");
        
       return isValid;
     
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
