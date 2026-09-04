package com.mockmate.auth;

import com.mockmate.user.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
  Optional<PasswordResetToken> findByTokenHash(String tokenHash);

  @Transactional
  @Modifying
  @Query("DELETE FROM PasswordResetToken p WHERE p.user = :user")
  void deleteByUser(@Param("user") User user);
}
