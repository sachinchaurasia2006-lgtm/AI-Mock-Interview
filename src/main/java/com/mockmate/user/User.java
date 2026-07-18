package com.mockmate.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="users")
public class User {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(nullable=false) private String name;
  @Column(nullable=false, unique=true) private String email;
  @Column(nullable=false) private String password;
  private String resumePath;
  @Column(nullable=false, updatable=false) private Instant createdAt = Instant.now();
  public Long getId(){return id;} public String getName(){return name;} public void setName(String v){name=v;} public String getEmail(){return email;} public void setEmail(String v){email=v;} public String getPassword(){return password;} public void setPassword(String v){password=v;} public String getResumePath(){return resumePath;} public void setResumePath(String v){resumePath=v;}
}
