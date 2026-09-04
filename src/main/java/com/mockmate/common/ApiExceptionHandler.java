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
  @ExceptionHandler(IllegalStateException.class)
  ResponseEntity<?> illegalState(IllegalStateException e) { return error(HttpStatus.BAD_REQUEST, e.getMessage()); }
  @ExceptionHandler(SecurityException.class)
  ResponseEntity<?> forbidden(SecurityException e) { return error(HttpStatus.FORBIDDEN, e.getMessage()); }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> validation(MethodArgumentNotValidException e) { return error(HttpStatus.BAD_REQUEST, e.getBindingResult().getFieldError().getDefaultMessage()); }
  @ExceptionHandler(Exception.class)
  ResponseEntity<?> general(Exception e) { return error(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "An unexpected error occurred"); }
  private ResponseEntity<?> error(HttpStatus status, String message) { return ResponseEntity.status(status).body(Map.of("timestamp", Instant.now(), "status", status.value(), "message", message)); }
}
