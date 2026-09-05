package com.mockmate.ai;

import com.mockmate.interview.InterviewType;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@ConditionalOnProperty(name = "app.openai.enabled", havingValue = "false", matchIfMissing = true)
public class LocalAiInterviewService implements AiInterviewService {

  @Override
  public List<String> generateQuestions(InterviewType t, String role, String resume, int count) {
    String combinedContext = ((role == null ? "" : role) + " " + (resume == null ? "" : resume)).toLowerCase();
    List<String> list = new ArrayList<>();

    // Contextual custom questions based on role keywords
    if (combinedContext.contains("kafka")) {
      list.add("How does Apache Kafka ensure message ordering and fault-tolerant partition replication in high-throughput clusters?");
    }
    if (combinedContext.contains("microservice") || combinedContext.contains("distributed")) {
      list.add("How do you implement distributed transactions and data consistency across microservices using the Saga Pattern?");
    }
    if (combinedContext.contains("security") || combinedContext.contains("auth")) {
      list.add("Explain OAuth 2.0 PKCE flow, JWT security best practices, and protection against CSRF and token hijacking.");
    }
    if (combinedContext.contains("react") || combinedContext.contains("frontend")) {
      list.add("Explain React Virtual DOM reconciliation (Fiber architecture), memoization with useMemo/useCallback, and state management trade-offs.");
    }
    if (combinedContext.contains("docker") || combinedContext.contains("k8s") || combinedContext.contains("kubernetes") || combinedContext.contains("devops")) {
      list.add("Describe a production Kubernetes deployment strategy (Canary vs Blue/Green) with automated health probes and horizontal pod autoscaling.");
    }

    List<String> standardBank = switch (t) {
      case HR -> List.of(
          "Tell me about yourself, your recent engineering projects, and why you want this role.",
          "Describe a challenging situation in a team or project and how you resolved it.",
          "Tell me about a time you had a technical disagreement with a teammate. How did you align?",
          "How do you prioritize competing deadlines and manage engineering technical debt?",
          "What motivates you to deliver high-quality software, and where do you see your technical growth?",
          "Describe a situation where a production outage occurred. How did you triage and perform the post-mortem?"
      );
      case JAVA -> List.of(
          "Explain the difference between HashMap and ConcurrentHashMap in Java.",
          "How does garbage collection work in modern Java (JVM memory areas & G1/ZGC)?",
          "Explain SOLID design principles with a practical Java/Spring example.",
          "What is the difference between Synchronized blocks, ReentrantLock, and Atomic variables?",
          "How does Spring Boot dependency injection and bean lifecycle management work under the hood?",
          "Explain Java CompletableFuture and virtual threads (Project Loom) for high-concurrency throughput."
      );
      case DSA -> List.of(
          "How would you find the first non-repeating character in a string with optimal complexity?",
          "Compare Breadth-First Search (BFS) and Depth-First Search (DFS) with time and space trade-offs.",
          "Design an efficient algorithm to detect and find the starting node of a cycle in a linked list.",
          "How do you implement an LRU (Least Recently Used) cache with O(1) get and put operations?",
          "Explain how you would solve the Two Sum and 3Sum problems efficiently using hash maps or two pointers.",
          "How would you design an algorithm to find the Median in a stream of running numbers using Heaps?"
      );
      case TECHNICAL -> List.of(
          "Describe a scalable REST API architecture you built and your error-handling/validation strategy.",
          "How would you design a high-throughput distributed authentication and rate-limiting system?",
          "Explain database indexing strategies, B-Trees, and performance trade-offs in high-load queries.",
          "How do you handle database transactions and data consistency across distributed microservices (Saga pattern)?",
          "What strategies do you use for caching with Redis, and how do you handle cache invalidation & stampedes?",
          "How would you design a global URL Shortener service (like Bitly) supporting 100M daily writes?"
      );
    };

    for (String q : standardBank) {
      if (!list.contains(q)) {
        list.add(q);
      }
    }

    return list.stream().limit(Math.max(1, Math.min(count, list.size()))).toList();
  }

  @Override
  public Evaluation evaluate(InterviewType type, String q, String a) {
    int words = a == null || a.trim().isEmpty() ? 0 : a.trim().split("\\s+").length;
    int score = words == 0 ? 0 : Math.min(100, Math.max(25, words * 3 + (a != null && a.toLowerCase().contains("example") ? 15 : 0)));
    String feedback = words < 25
        ? "Add more depth and technical precision. Follow the STAR framework (Situation, Task, Action, Result) with measurable metrics."
        : "Strong foundation. You articulated the core rationale well. To achieve a 10/10, make architectural trade-offs and business impact even more explicit.";

    List<String> weaknesses = words < 25
        ? List.of("Answer depth", "Specific technical examples", "STAR structure")
        : List.of("Quantifying business impact", "Edge-case trade-offs");

    String ideal = getIdealBenchmarkAnswer(type, q);
    return new Evaluation(score, feedback, weaknesses, ideal);
  }

  private String getIdealBenchmarkAnswer(InterviewType type, String q) {
    String lower = q.toLowerCase();
    if (lower.contains("kafka")) {
      return "Apache Kafka partitions topics across broker clusters. Message order is guaranteed strictly per partition using incremental offsets. Fault tolerance is managed via In-Sync Replicas (ISR) and Raft-based KRaft metadata consensus with acks=all producing durability.";
    }
    if (lower.contains("saga") || (lower.contains("microservice") && lower.contains("transaction"))) {
      return "The Saga Pattern orchestrates distributed transactions as a sequence of local transactions. If a step fails, compensating transactions are executed in reverse order. It can be implemented via Choreography (event-driven via message bus) or Orchestration (central state coordinator).";
    }
    if (lower.contains("react") || lower.contains("virtual dom")) {
      return "React Fiber builds an in-memory Virtual DOM tree representation, performing heuristic O(N) reconciliation diffing. Updates are prioritized asynchronously. Component renders are optimized using React.memo for pure components and useMemo/useCallback to preserve reference equality across render passes.";
    }
    if (lower.contains("kubernetes") || lower.contains("canary")) {
      return "Canary deployments roll out new container versions to a small subset (e.g. 5-10%) of traffic via ingress routing/service mesh. Kubernetes Deployment manages replica sets, using readiness and liveness probes to prevent bad releases, falling back automatically if error thresholds are exceeded.";
    }
    if (lower.contains("hashmap") || lower.contains("concurrenthashmap")) {
      return "HashMap is non-synchronized and allows null keys/values, making it optimal for single-threaded use. ConcurrentHashMap achieves thread safety through bucket-level synchronized locks and Lock-Free CAS (Compare-And-Swap) operations on node creation, permitting concurrent non-blocking reads and segmented writes without locking the entire table.";
    }
    if (lower.contains("garbage collection") || lower.contains("jvm")) {
      return "The JVM divides heap memory into Young Generation (Eden, Survivor spaces) and Old Generation. Minor GC reclaims short-lived objects from Eden quickly via copying. Objects surviving multiple cycles are promoted to Old Generation, collected by Major/Full GC. Modern collectors like G1GC and ZGC divide heap into regions and execute concurrent phase mark-and-compact to reduce STW (Stop-The-World) latency below 1-10ms.";
    }
    if (lower.contains("solid")) {
      return "1. Single Responsibility (SRP): A class has only one reason to change. 2. Open/Closed (OCP): Code is open for extension via interfaces but closed for modification. 3. Liskov Substitution (LSP): Derived classes must substitute for base classes without breaking behavior. 4. Interface Segregation (ISP): Clients shouldn't depend on interfaces they don't use. 5. Dependency Inversion (DIP): High-level modules depend on abstractions (e.g. Spring @Autowired interfaces), not concrete implementations.";
    }
    if (lower.contains("non-repeating")) {
      return "Pass 1: Traverse the string to build a frequency map of character counts in O(N) time. Pass 2: Traverse the string once more to find the first character with count == 1 in O(N) time. Overall Time Complexity is O(N), Space Complexity is O(1) since character set size is bounded (e.g., 26 lowercase letters or 256 ASCII).";
    }
    if (lower.contains("bfs") || lower.contains("dfs")) {
      return "BFS explores neighbor-by-neighbor using a Queue—ideal for finding the shortest path on unweighted graphs with O(V+E) time and O(V) queue space. DFS explores depth-first using recursion or a Stack—ideal for topological sorting, cycle detection, and backtracking with O(V+E) time and O(depth) memory.";
    }
    if (lower.contains("cycle")) {
      return "Use Floyd's Cycle-Finding Algorithm (Tortoise and Hare). Initialize two pointers: slow moves 1 step, fast moves 2 steps. If slow == fast, a cycle exists. To find the start node, reset slow to head; advance both slow and fast by 1 step—their intersection point is the start of the cycle. Time: O(N), Space: O(1).";
    }
    if (lower.contains("rest api")) {
      return "Structure APIs around resource nouns using standard HTTP verbs (GET, POST, PUT, DELETE). Implement centralized validation with Bean Validation (@Valid), uniform RFC 7807 error responses with @ControllerAdvice, structured logging with correlation IDs, and idempotent PUT/DELETE operations.";
    }
    if (lower.contains("authentication") || lower.contains("rate-limiting")) {
      return "Issue stateless, short-lived JWT tokens (15-30m) paired with rotating refresh tokens stored in secure HttpOnly SameSite cookies. Implement token revocation via Redis blacklist and sliding-window rate limiting using Redis Token Bucket or Leaky Bucket algorithms.";
    }
    if (lower.contains("indexing") || lower.contains("database")) {
      return "B-Tree indexes speed up equality and range queries from O(N) full table scans to O(log N) tree lookups. Trade-offs include write amplification on INSERT/UPDATE/DELETE due to index node splitting and increased RAM/disk consumption. Use composite indexes following the Leftmost Prefix rule.";
    }
    if (lower.contains("tell me about yourself") || lower.contains("team") || lower.contains("disagreement") || lower.contains("motivate")) {
      return "Structure your response with STAR: 1. Situation: Set the business context succinctly. 2. Task: Define your core objective and technical hurdles. 3. Action: Detail the specific technical, architectural, or leadership decisions you drove. 4. Result: Conclude with measurable impact (e.g., 45% latency drop, zero downtime release, or enhanced cross-team velocity).";
    }
    return "An ideal answer directly addresses the prompt, opens with a 1-sentence high-level summary, details the technical mechanism or STAR evidence, and finishes with trade-offs and quantifiable business results.";
  }
}
