package com.mockmate.interview;

import com.mockmate.user.User; import jakarta.persistence.*; import java.time.Instant; import java.util.*;
@Entity public class Interview {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private User user;
  @Enumerated(EnumType.STRING) @Column(nullable=false) private InterviewType type;
  @Column(nullable=false) private String targetRole;
  private String status="IN_PROGRESS"; private Integer score; @Column(length=5000) private String weaknessAnalysis;
  @Column(nullable=false,updatable=false) private Instant createdAt=Instant.now();
  @OneToMany(mappedBy="interview",cascade=CascadeType.ALL,orphanRemoval=true) private List<InterviewQuestion> questions=new ArrayList<>();
  public Long getId(){return id;} public User getUser(){return user;} public void setUser(User v){user=v;} public InterviewType getType(){return type;} public void setType(InterviewType v){type=v;} public String getTargetRole(){return targetRole;} public void setTargetRole(String v){targetRole=v;} public String getStatus(){return status;} public void setStatus(String v){status=v;} public Integer getScore(){return score;} public void setScore(Integer v){score=v;} public String getWeaknessAnalysis(){return weaknessAnalysis;} public void setWeaknessAnalysis(String v){weaknessAnalysis=v;} public Instant getCreatedAt(){return createdAt;} public List<InterviewQuestion> getQuestions(){return questions;}
}
