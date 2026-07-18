package com.mockmate.security;

import com.mockmate.user.UserRepository;
import jakarta.servlet.*; import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
class JwtFilter extends OncePerRequestFilter {
  private final JwtService jwt; private final UserRepository users;
  JwtFilter(JwtService jwt, UserRepository users){this.jwt=jwt;this.users=users;}
  @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException {
    String header=req.getHeader("Authorization");
    if(header!=null && header.startsWith("Bearer ")) try { String email=jwt.email(header.substring(7)); users.findByEmail(email).ifPresent(user -> SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(email,null,java.util.List.of(new SimpleGrantedAuthority("ROLE_USER"))))); } catch(Exception ignored) {}
    chain.doFilter(req,res);
  }
}
