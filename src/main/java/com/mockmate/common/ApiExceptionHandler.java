package com.mockmate.common;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
class ApiExceptionHandler {
  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<?> badRequest(IllegalArgumentException e) { return error(HttpStatus.BAD_REQUEST, e.getMessage()); }
  @ExceptionHandler(SecurityException.class)
  ResponseEntity<?> forbidden(SecurityException e) { return error(HttpStatus.FORBIDDEN, e.getMessage()); }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> validation(MethodArgumentNotValidException e) { return error(HttpStatus.BAD_REQUEST, e.getBindingResult().getFieldError().getDefaultMessage()); }
  private ResponseEntity<?> error(HttpStatus status, String message) { return ResponseEntity.status(status).body(Map.of("timestamp", Instant.now(), "status", status.value(), "message", message)); }
}
