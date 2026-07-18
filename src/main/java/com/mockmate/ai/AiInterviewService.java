package com.mockmate.ai;
import com.mockmate.interview.InterviewType; import java.util.*;
public interface AiInterviewService { List<String> generateQuestions(InterviewType type,String role,String resumeText,int count); Evaluation evaluate(InterviewType type,String question,String answer); record Evaluation(int score,String feedback,List<String> weaknesses){} }
