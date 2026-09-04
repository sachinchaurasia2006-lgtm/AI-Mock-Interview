package com.mockmate.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private static final Logger log = LoggerFactory.getLogger(EmailService.class);
  private final Optional<JavaMailSender> mailSender;
  private final ObjectMapper objectMapper;

  @Value("${resend.api-key:${RESEND_API_KEY:}}")
  private String resendApiKey;

  @Value("${resend.from:${RESEND_FROM:}}")
  private String fromEmail;

  @Value("${spring.mail.host:}")
  private String mailHost;

  @Value("${app.password-reset.frontend-url:http://localhost:5173}")
  private String frontendUrl;

  public EmailService(Optional<JavaMailSender> mailSender) {
    this.mailSender = mailSender;
    this.objectMapper = new ObjectMapper();
  }

  public boolean isEmailConfigured() {
    return (resendApiKey != null && !resendApiKey.trim().isBlank()
        && fromEmail != null && !fromEmail.trim().isBlank())
        || (mailHost != null && !mailHost.trim().isBlank() && mailSender.isPresent());
  }

  public void sendPasswordResetEmail(String toEmail, String token) {
    String resetLink = frontendUrl + (frontendUrl.contains("?") ? "&" : "?") + "resetToken=" + token;
    String subject = "MockMate Security: Reset your password";
    String htmlContent = buildResetHtml(token, resetLink);
    String textContent = "MockMate Security Verification\n\n"
        + "Your password reset code is: " + token + "\n\n"
        + "Or click the link below to reset your password:\n" + resetLink + "\n\n"
        + "This code is valid for 30 minutes. If you did not request this, please ignore this email.";

    // 1. Try Resend REST API if RESEND_API_KEY is provided
    if (resendApiKey != null && !resendApiKey.trim().isBlank()) {
      sendViaResendApi(toEmail, subject, htmlContent, textContent);
      return;
    }

    // 2. Fallback to Spring Mail / SMTP if configured
    if (mailHost != null && !mailHost.trim().isBlank() && mailSender.isPresent()) {
      sendViaSmtp(toEmail, subject, htmlContent, textContent);
      return;
    }

    log.info("No email service configured (Resend API or SMTP). Reset code for {}: {}", toEmail, token);
  }

  private void sendViaResendApi(String toEmail, String subject, String htmlContent, String textContent) {
    try {
      Map<String, Object> payload = Map.of(
          "from", fromEmail,
          "to", List.of(toEmail),
          "subject", subject,
          "html", htmlContent,
          "text", textContent
      );
      String json = objectMapper.writeValueAsString(payload);

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.resend.com/emails"))
          .header("Authorization", "Bearer " + resendApiKey.trim())
          .header("Content-Type", "application/json")
          .timeout(Duration.ofSeconds(15))
          .POST(HttpRequest.BodyPublishers.ofString(json))
          .build();

      HttpClient httpClient = HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(10))
          .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        log.info("Successfully sent password reset email via Resend to {}", toEmail);
      } else {
        log.error("Resend API failed with status {}: {}", response.statusCode(), response.body());
        throw new IllegalStateException("Resend email failed (" + response.statusCode() + "): " + response.body());
      }
    } catch (IllegalStateException e) {
      throw e;
    } catch (Exception e) {
      log.error("Failed to send email via Resend API", e);
      throw new IllegalStateException("Failed to send email via Resend: " + e.getMessage());
    }
  }

  private void sendViaSmtp(String toEmail, String subject, String htmlContent, String textContent) {
    try {
      JavaMailSender sender = mailSender.orElseThrow();
      MimeMessage message = sender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(fromEmail);
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setText(textContent, htmlContent);
      sender.send(message);
      log.info("Successfully sent password reset email via SMTP to {}", toEmail);
    } catch (Exception e) {
      log.error("Failed to send email via SMTP", e);
      throw new IllegalStateException("Failed to send email via SMTP: " + e.getMessage());
    }
  }

  private String buildResetHtml(String token, String resetLink) {
    return "<!DOCTYPE html>"
        + "<html>"
        + "<head><meta charset='UTF-8'></head>"
        + "<body style='font-family: Arial, sans-serif; background-color: #0b0f10; color: #edf5f1; padding: 30px; margin: 0;'>"
        + "<div style='max-width: 540px; margin: 0 auto; background-color: #101718; border: 1px solid #273638; border-radius: 8px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);'>"
        + "  <div style='display: flex; align-items: center; margin-bottom: 24px;'>"
        + "    <div style='background-color: #25a87d; color: #ffffff; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-size: 18px; margin-right: 12px;'>M</div>"
        + "    <h2 style='margin: 0; color: #f0f4f2; font-size: 20px; letter-spacing: 1px;'>MOCKMATE</h2>"
        + "  </div>"
        + "  <h3 style='color: #25a87d; margin-top: 0;'>Password Reset Verification</h3>"
        + "  <p style='color: #aebdba; font-size: 14px; line-height: 1.6;'>We received a request to reset your MockMate password. Use the security code below to complete the verification:</p>"
        + "  <div style='background-color: #15282a; border: 1px dashed #25a87d; border-radius: 6px; padding: 18px; text-align: center; margin: 24px 0;'>"
        + "    <div style='color: #aebdba; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;'>Your Security Code</div>"
        + "    <div style='font-family: monospace; font-size: 15px; font-weight: bold; color: #54c99f; word-break: break-all;'>" + token + "</div>"
        + "  </div>"
        + "  <div style='text-align: center; margin: 28px 0;'>"
        + "    <a href='" + resetLink + "' style='background-color: #1d6b5a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;'>Reset Password Directly &rarr;</a>"
        + "  </div>"
        + "  <p style='color: #7b8e8b; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #273638; padding-top: 16px;'>"
        + "    This link and code will expire in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email; your account remains secure."
        + "  </p>"
        + "</div>"
        + "</body>"
        + "</html>";
  }
}
