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
  private final boolean exposeDevelopmentToken;

  public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, PasswordResetTokenRepository resetTokens, EmailService emailService, @Value("${app.password-reset.expose-development-token:false}") boolean exposeDevelopmentToken) {
    this.users = users;
    this.encoder = encoder;
    this.jwt = jwt;
    this.resetTokens = resetTokens;
    this.emailService = emailService;
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
      return new ForgotPasswordResponse("If an account exists, a reset link has been sent.", null);
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
    if (hasEmailService) {
      emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
    }
    if (!hasEmailService && !exposeDevelopmentToken) {
      throw new IllegalStateException("Password reset email is not configured. Please contact support.");
    }
    return new ForgotPasswordResponse(
      hasEmailService ? "If an account exists, a reset link/code has been sent to your email." : "Development mode: use the code below to reset your password.",
      hasEmailService ? null : rawToken
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
        .orElseThrow(() -> new IllegalArgumentException("This reset code is invalid or has expired"));
    if (reset.getExpiresAt().isBefore(Instant.now())) {
      resetTokens.delete(reset);
      throw new IllegalArgumentException("This reset code has expired. Request a new one.");
    }
    User user = reset.getUser();
    user.setPassword(encoder.encode(r.password()));
    users.save(user);
    resetTokens.delete(reset);
    resetTokens.flush();
    return new ResetPasswordResponse("Password changed. You can now sign in.");
  }

  private String newToken() {
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String hash(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public record RegisterRequest(@NotBlank String name, @Email String email, @Size(min = 8, message = "Password must be at least 8 characters") String password) {}
  public record LoginRequest(@Email String email, @NotBlank String password) {}
  public record ForgotPasswordRequest(@Email String email) {}
  public record ResetPasswordRequest(@NotBlank String token, @Size(min = 8, message = "Password must be at least 8 characters") String password) {}
  public record AuthResponse(String token, String name, String email) {}
  public record ForgotPasswordResponse(String message, String developmentToken) {}
  public record ResetPasswordResponse(String message) {}
}
