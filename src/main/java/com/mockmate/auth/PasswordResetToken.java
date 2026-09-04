package com.mockmate.auth;

import com.mockmate.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
class PasswordResetToken {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @OneToOne(optional = false) private User user;
  @Column(nullable = false, unique = true, length = 64) private String tokenHash;
  @Column(nullable = false) private Instant expiresAt;
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
  public String getTokenHash() { return tokenHash; }
  public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
