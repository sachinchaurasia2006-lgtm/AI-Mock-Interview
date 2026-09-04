package com.mockmate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mockmate.auth.PasswordResetTokenRepository;
import com.mockmate.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MockMateApplicationTests {
  @Autowired private MockMvc mockMvc;
  @Autowired private UserRepository users;
  @Autowired private PasswordResetTokenRepository resetTokens;

  @BeforeEach
  void clearData() {
    resetTokens.deleteAll();
    users.deleteAll();
  }

  @Test
  void registrationReturnsTokenAndDashboardRequiresIt() throws Exception {
    MvcResult registration = mockMvc.perform(post("/api/auth/register")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"name\":\"Asha\",\"email\":\"asha@example.com\",\"password\":\"password123\"}"))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.token").isNotEmpty())
      .andReturn();

    String token = com.jayway.jsonpath.JsonPath.read(registration.getResponse().getContentAsString(), "$.token");
    mockMvc.perform(get("/api/dashboard"))
      .andExpect(status().isForbidden());
    mockMvc.perform(get("/api/dashboard").header("Authorization", "Bearer " + token))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.totalInterviews").value(0));
  }

  @Test
  void rejectsInvalidRegistrationAndLogin() throws Exception {
    mockMvc.perform(post("/api/auth/register")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"name\":\"\",\"email\":\"not-an-email\",\"password\":\"short\"}"))
      .andExpect(status().isBadRequest());

    mockMvc.perform(post("/api/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"email\":\"missing@example.com\",\"password\":\"password123\"}"))
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.message").value("Invalid email or password"));
  }

  @Test
  void developmentModeReturnsResetCodeForAnExistingUserWhenEmailIsNotConfigured() throws Exception {
    mockMvc.perform(post("/api/auth/register")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"name\":\"Asha\",\"email\":\"asha@example.com\",\"password\":\"password123\"}"))
      .andExpect(status().isCreated());

    mockMvc.perform(post("/api/auth/forgot-password")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"email\":\"asha@example.com\"}"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.developmentToken").isNotEmpty());
  }
}
