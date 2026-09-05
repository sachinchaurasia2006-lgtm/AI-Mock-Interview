package com.mockmate.ai;

import com.mockmate.interview.InterviewType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "app.openai.enabled", havingValue = "true")
public class OpenAiInterviewService implements AiInterviewService {
  private final RestClient client;
  private final String model;

  public OpenAiInterviewService(@Value("${app.openai.api-key}") String key, @Value("${app.openai.model}") String model) {
    this.model = model;
    this.client = RestClient.builder()
        .baseUrl("https://api.openai.com/v1")
        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + key)
        .build();
  }

  @Override
  public List<String> generateQuestions(InterviewType type, String role, String resume, int count) {
    String prompt = "Generate exactly " + count + " concise " + type + " interview questions for a " + role + " candidate."
        + (resume != null && !resume.isBlank() ? " Candidate resume context: " + resume : "")
        + " Return one question per line without numbering.";
    String out = ask(prompt);
    return Arrays.stream(out.split("\\R"))
        .map(s -> s.replaceFirst("^\\s*\\d+[.)]\\s*", "").trim())
        .filter(s -> !s.isBlank())
        .limit(count)
        .toList();
  }

  @Override
  public Evaluation evaluate(InterviewType type, String q, String answer) {
    String out = ask("Evaluate this " + type + " interview answer. Return format strictly as:\nSCORE: <0-100>\nFEEDBACK: <feedback text>\nWEAKNESSES: <comma-separated weaknesses>\nIDEAL_ANSWER: <exemplary 10/10 model answer>\n\nQuestion: " + q + "\nAnswer: " + answer);
    int score = 50;
    try {
      score = Integer.parseInt(out.replaceAll("(?s).*?SCORE:\\s*(\\d+).*", "$1"));
    } catch (Exception ignored) {}

    String feedback = out.contains("FEEDBACK:")
        ? out.substring(out.indexOf("FEEDBACK:") + 9).split("WEAKNESSES:")[0].trim()
        : out;
    String weak = out.contains("WEAKNESSES:")
        ? out.substring(out.indexOf("WEAKNESSES:") + 11).split("IDEAL_ANSWER:")[0].trim()
        : "Answer depth";
    String ideal = out.contains("IDEAL_ANSWER:")
        ? out.substring(out.indexOf("IDEAL_ANSWER:") + 13).trim()
        : "A complete answer clearly articulates the core mechanism, STAR evidence, and architectural trade-offs.";

    return new Evaluation(
        Math.min(100, Math.max(0, score)),
        feedback,
        Arrays.stream(weak.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList(),
        ideal
    );
  }

  @SuppressWarnings("unchecked")
  private String ask(String prompt) {
    Map<String, Object> body = Map.of(
        "model", model,
        "messages", List.of(
            Map.of("role", "system", "content", "You are an expert interview coach and senior engineering hiring manager."),
            Map.of("role", "user", "content", prompt)
        ),
        "temperature", 0.4
    );
    Map<String, Object> response = client.post()
        .uri("/chat/completions")
        .contentType(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve()
        .body(Map.class);
    try {
      return String.valueOf(((Map<String, Object>) ((List<?>) response.get("choices")).getFirst()).get("message") instanceof Map<?, ?> m ? m.get("content") : "");
    } catch (Exception e) {
      throw new IllegalStateException("Unable to parse OpenAI response");
    }
  }
}
