package com.mockmate.auth;

import com.mockmate.security.JwtService; import com.mockmate.user.*;
import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") public class AuthController {
  private final UserRepository users; private final PasswordEncoder encoder; private final JwtService jwt;
  AuthController(UserRepository users,PasswordEncoder encoder,JwtService jwt){this.users=users;this.encoder=encoder;this.jwt=jwt;}
  @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) AuthResponse register(@Valid @RequestBody RegisterRequest r){ if(users.findByEmail(r.email()).isPresent())throw new IllegalArgumentException("Email is already registered"); User u=new User();u.setName(r.name());u.setEmail(r.email().toLowerCase());u.setPassword(encoder.encode(r.password()));users.save(u);return new AuthResponse(jwt.create(u.getEmail()),u.getName(),u.getEmail()); }
  @PostMapping("/login") AuthResponse login(@Valid @RequestBody LoginRequest r){ User u=users.findByEmail(r.email().toLowerCase()).orElseThrow(()->new IllegalArgumentException("Invalid email or password"));if(!encoder.matches(r.password(),u.getPassword()))throw new IllegalArgumentException("Invalid email or password");return new AuthResponse(jwt.create(u.getEmail()),u.getName(),u.getEmail());}
  record RegisterRequest(@NotBlank String name,@Email String email,@Size(min=8,message="Password must be at least 8 characters") String password){} record LoginRequest(@Email String email,@NotBlank String password){} record AuthResponse(String token,String name,String email){}
}
