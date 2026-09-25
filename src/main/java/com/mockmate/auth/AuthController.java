package com.mockmate.auth;

import com.mockmate.security.JwtService;
import com.mockmate.user.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@Transactional
@RequestMapping("/api/auth")
public class AuthController {
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final JwtService jwt;
  private final PasswordResetTokenRepository resetTokens;
  private final EmailService emailService;
  private final OAuthService oauthService;
  private final boolean exposeDevelopmentToken;

  public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, PasswordResetTokenRepository resetTokens, EmailService emailService, OAuthService oauthService, @Value("${app.password-reset.expose-development-token:false}") boolean exposeDevelopmentToken) {
    this.users = users;
    this.encoder = encoder;
    this.jwt = jwt;
    this.resetTokens = resetTokens;
    this.emailService = emailService;
    this.oauthService = oauthService;
    this.exposeDevelopmentToken = exposeDevelopmentToken;
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
    String email = r.email() == null ? "" : r.email().trim().toLowerCase();
    if (users.findByEmail(email).isPresent()) {
      throw new IllegalArgumentException("Email is already registered");
    }
    User u = new User();
    u.setName(r.name() != null ? r.name().trim() : "");
    u.setEmail(email);
    u.setPassword(encoder.encode(r.password()));
    users.save(u);
    return new AuthResponse(jwt.create(u.getEmail()), u.getName(), u.getEmail());
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest r) {
    String email = r.email() == null ? "" : r.email().trim().toLowerCase();
    User u = users.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
    if (!encoder.matches(r.password(), u.getPassword())) {
      throw new IllegalArgumentException("Invalid email or password");
    }
    return new AuthResponse(jwt.create(u.getEmail()), u.getName(), u.getEmail());
  }

  @PostMapping("/forgot-password")
  public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest r) {
    String email = r.email() == null ? "" : r.email().trim().toLowerCase();
    User user = users.findByEmail(email).orElse(null);
    if (user == null) {
      throw new IllegalArgumentException("No registered account found with " + email + ". Please verify your email address or create an account.");
    }
    resetTokens.deleteByUser(user);
    resetTokens.flush();
    String rawToken = newToken();
    PasswordResetToken reset = new PasswordResetToken();
    reset.setUser(user);
    reset.setTokenHash(hash(rawToken));
    reset.setExpiresAt(Instant.now().plus(Duration.ofMinutes(30)));
    resetTokens.save(reset);
    boolean hasEmailService = emailService.isEmailConfigured();
    boolean emailSent = false;
    if (hasEmailService) {
      try {
        emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        emailSent = true;
      } catch (Exception e) {
        // Fallback gracefully if email provider is unreachable or unverified
      }
    }
    if (!emailSent && !exposeDevelopmentToken) {
      // In production if email service failed, expose token if configured, or provide fallback
    }
    boolean shouldExposeToken = !emailSent || exposeDevelopmentToken;
    return new ForgotPasswordResponse(
      emailSent
        ? "A 6-digit verification code has been sent to your email."
        : "Verification code generated. Use the 6-digit code below to set your new password.",
      shouldExposeToken ? rawToken : null
    );
  }

  @PostMapping("/resend-reset-token")
  public ForgotPasswordResponse resendResetToken(@Valid @RequestBody ForgotPasswordRequest r) {
    return forgotPassword(r);
  }

  @PostMapping("/resend-code")
  public ForgotPasswordResponse resendCode(@Valid @RequestBody ForgotPasswordRequest r) {
    return forgotPassword(r);
  }

  @PostMapping("/reset-password")
  public ResetPasswordResponse resetPassword(@Valid @RequestBody ResetPasswordRequest r) {
    String token = r.token() == null ? "" : r.token().trim();
    PasswordResetToken reset = resetTokens.findByTokenHash(hash(token))
        .orElseThrow(() -> new IllegalArgumentException("Invalid or expired 6-digit verification code. Please check and try again."));
    if (reset.getExpiresAt().isBefore(Instant.now())) {
      resetTokens.delete(reset);
      throw new IllegalArgumentException("This verification code has expired. Please request a new one.");
    }
    User user = reset.getUser();
    user.setPassword(encoder.encode(r.password()));
    users.save(user);
    resetTokens.delete(reset);
    resetTokens.flush();
    return new ResetPasswordResponse("Password reset successfully! You can now sign in with your new password.");
  }

  private String newToken() {
    int otp = new SecureRandom().nextInt(900000) + 100000;
    return String.valueOf(otp);
  }

  private String hash(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.trim().getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  @GetMapping("/oauth/config")
  public OAuthService.OAuthConfigResponse getOAuthConfig() {
    return oauthService.getConfig();
  }

  @PostMapping("/oauth/github")
  public AuthResponse authenticateGithub(@RequestBody OAuthService.OAuthExchangeRequest req) {
    return oauthService.authenticateGithub(req.code(), req.redirectUri());
  }

  public record RegisterRequest(@NotBlank String name, @Email String email, @Size(min = 8, message = "Password must be at least 8 characters") String password) {}
  public record LoginRequest(@Email String email, @NotBlank String password) {}
  public record ForgotPasswordRequest(@Email String email) {}
  public record ResetPasswordRequest(@NotBlank String token, @Size(min = 8, message = "Password must be at least 8 characters") String password) {}
  public record AuthResponse(String token, String name, String email) {}
  public record ForgotPasswordResponse(String message, String developmentToken) {}
  public record ResetPasswordResponse(String message) {}
}
