package com.mockmate.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockmate.security.JwtService;
import com.mockmate.user.User;
import com.mockmate.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class OAuthService {
  private static final Logger log = LoggerFactory.getLogger(OAuthService.class);

  private final UserRepository users;
  private final JwtService jwt;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  @Value("${app.oauth.github.client-id:}")
  private String githubClientId;

  @Value("${app.oauth.github.client-secret:}")
  private String githubClientSecret;

  public OAuthService(UserRepository users, JwtService jwt, ObjectMapper objectMapper) {
    this.users = users;
    this.jwt = jwt;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
  }

  public OAuthConfigResponse getConfig() {
    return new OAuthConfigResponse(
        isConfigured(githubClientId) && isConfigured(githubClientSecret),
        isConfigured(githubClientId) ? githubClientId.trim() : ""
    );
  }

  public AuthController.AuthResponse authenticateGithub(String code, String redirectUri) {
    if (!isConfigured(githubClientId) || !isConfigured(githubClientSecret)) {
      throw new IllegalStateException("GitHub OAuth is not configured on the server.");
    }
    if (code == null || code.isBlank()) {
      throw new IllegalArgumentException("OAuth code is required.");
    }

    try {
      Map<String, String> tokenParams = new HashMap<>();
      tokenParams.put("code", code.trim());
      tokenParams.put("client_id", githubClientId.trim());
      tokenParams.put("client_secret", githubClientSecret.trim());
      if (redirectUri != null && !redirectUri.isBlank()) {
        tokenParams.put("redirect_uri", redirectUri.trim());
      }

      String formBody = encodeFormData(tokenParams);

      HttpRequest tokenRequest = HttpRequest.newBuilder()
          .uri(URI.create("https://github.com/login/oauth/access_token"))
          .header("Content-Type", "application/x-www-form-urlencoded")
          .header("Accept", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(formBody))
          .build();

      HttpResponse<String> tokenResponse = httpClient.send(tokenRequest, HttpResponse.BodyHandlers.ofString());
      if (tokenResponse.statusCode() >= 400) {
        log.error("GitHub token exchange failed: {}", tokenResponse.body());
        throw new IllegalArgumentException("Failed to exchange code with GitHub: " + extractErrorMessage(tokenResponse.body()));
      }

      JsonNode tokenJson = objectMapper.readTree(tokenResponse.body());
      if (tokenJson.has("error")) {
        String errorDesc = tokenJson.path("error_description").asText(tokenJson.path("error").asText());
        throw new IllegalArgumentException("GitHub authentication error: " + errorDesc);
      }

      String accessToken = tokenJson.path("access_token").asText();
      if (accessToken == null || accessToken.isBlank()) {
        throw new IllegalStateException("No access token returned by GitHub.");
      }

      HttpRequest profileRequest = HttpRequest.newBuilder()
          .uri(URI.create("https://api.github.com/user"))
          .header("Authorization", "Bearer " + accessToken)
          .header("User-Agent", "MockMate-App")
          .header("Accept", "application/vnd.github+json")
          .GET()
          .build();

      HttpResponse<String> profileResponse = httpClient.send(profileRequest, HttpResponse.BodyHandlers.ofString());
      if (profileResponse.statusCode() >= 400) {
        throw new IllegalArgumentException("Failed to fetch GitHub profile.");
      }

      JsonNode profileJson = objectMapper.readTree(profileResponse.body());
      String sub = profileJson.path("id").asText();
      String name = profileJson.path("name").asText();
      String login = profileJson.path("login").asText();
      String email = profileJson.path("email").asText();

      if (name == null || name.isBlank()) {
        name = login != null && !login.isBlank() ? login : "GitHub User";
      }

      if (email == null || email.isBlank() || "null".equalsIgnoreCase(email)) {
        email = fetchGithubPrimaryEmail(accessToken);
      }

      if (email == null || email.isBlank()) {
        email = login + "@users.noreply.github.com";
      }

      User user = findOrCreateOAuthUser(email, name, "GITHUB", sub);
      return new AuthController.AuthResponse(jwt.create(user.getEmail()), user.getName(), user.getEmail());
    } catch (IllegalArgumentException | IllegalStateException e) {
      throw e;
    } catch (Exception e) {
      log.error("GitHub OAuth error", e);
      throw new IllegalStateException("Authentication with GitHub failed: " + e.getMessage());
    }
  }

  private String fetchGithubPrimaryEmail(String accessToken) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.github.com/user/emails"))
          .header("Authorization", "Bearer " + accessToken)
          .header("User-Agent", "MockMate-App")
          .header("Accept", "application/vnd.github+json")
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        JsonNode emailsNode = objectMapper.readTree(response.body());
        if (emailsNode.isArray()) {
          for (JsonNode item : emailsNode) {
            if (item.path("primary").asBoolean() && item.path("verified").asBoolean()) {
              return item.path("email").asText();
            }
          }
          if (emailsNode.size() > 0) {
            return emailsNode.get(0).path("email").asText();
          }
        }
      }
    } catch (Exception e) {
      log.warn("Failed to fetch primary email from GitHub", e);
    }
    return null;
  }

  private User findOrCreateOAuthUser(String email, String name, String provider, String providerId) {
    String cleanEmail = email.trim().toLowerCase();
    return users.findByEmail(cleanEmail).map(existing -> {
      if (existing.getName() == null || existing.getName().isBlank()) {
        existing.setName(name != null && !name.isBlank() ? name.trim() : cleanEmail.split("@")[0]);
      }
      if (existing.getProvider() == null || "LOCAL".equals(existing.getProvider())) {
        existing.setProvider(provider);
      }
      if (existing.getProviderId() == null || existing.getProviderId().isBlank()) {
        existing.setProviderId(providerId);
      }
      return users.save(existing);
    }).orElseGet(() -> {
      User u = new User();
      u.setEmail(cleanEmail);
      u.setName(name != null && !name.isBlank() ? name.trim() : cleanEmail.split("@")[0]);
      u.setProvider(provider);
      u.setProviderId(providerId);
      return users.save(u);
    });
  }

  private boolean isConfigured(String value) {
    return value != null && !value.isBlank() && !value.startsWith("YOUR-");
  }

  private String encodeFormData(Map<String, String> data) {
    return data.entrySet().stream()
        .map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8) + "=" +
                      URLEncoder.encode(entry.getValue() != null ? entry.getValue() : "", StandardCharsets.UTF_8))
        .collect(Collectors.joining("&"));
  }

  private String extractErrorMessage(String body) {
    try {
      JsonNode node = objectMapper.readTree(body);
      if (node.has("error_description")) return node.get("error_description").asText();
      if (node.has("error")) return node.get("error").asText();
      if (node.has("message")) return node.get("message").asText();
    } catch (Exception ignored) {}
    return "Unknown response";
  }

  public record OAuthConfigResponse(
      boolean githubEnabled,
      String githubClientId
  ) {}

  public record OAuthExchangeRequest(
      String code,
      String redirectUri
  ) {}
}
