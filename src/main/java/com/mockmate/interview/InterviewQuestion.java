package com.mockmate.interview;
import jakarta.persistence.*;
@Entity public class InterviewQuestion {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne(optional=false) private Interview interview; @Column(length=3000,nullable=false) private String question; @Column(length=6000) private String answer; private Integer score; @Column(length=3000) private String feedback;
 public Long getId(){return id;} public Interview getInterview(){return interview;} public void setInterview(Interview v){interview=v;} public String getQuestion(){return question;} public void setQuestion(String v){question=v;} public String getAnswer(){return answer;} public void setAnswer(String v){answer=v;} public Integer getScore(){return score;} public void setScore(Integer v){score=v;} public String getFeedback(){return feedback;} public void setFeedback(String v){feedback=v;}
}
