package com.mockmate.interview;
import com.mockmate.user.User; import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface InterviewRepository extends JpaRepository<Interview,Long>{ List<Interview> findByUserOrderByCreatedAtDesc(User user); Optional<Interview> findByIdAndUser(Long id,User user); }
