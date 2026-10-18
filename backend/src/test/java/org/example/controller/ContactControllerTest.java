package org.example.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dto.ContactRequest;
import org.example.service.ContactService;
import org.example.service.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContactController.class)
class ContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ContactService contactService;

    @SpyBean
    private RateLimiterService rateLimiterService;

    private ContactRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new ContactRequest("John Doe", "john@example.com", "Project inquiry", "Hello, I would like to discuss a project.");
    }

    @Test
    @DisplayName("Extracts real client IP from X-Forwarded-For header when behind a proxy")
    void sendContactMessage_withXForwardedFor_extractsFirstClientIp() throws Exception {
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .header("X-Forwarded-For", "203.0.113.195, 70.41.3.18, 150.172.238.178"))
                .andExpect(status().isOk())
                .andExpect(content().string("Message sent successfully!"));

        verify(rateLimiterService).checkAndRecord(eq("203.0.113.195"));
        verify(contactService).sendContactMessage(any(ContactRequest.class));
    }

    @Test
    @DisplayName("Extracts client IP from X-Real-IP when X-Forwarded-For is missing")
    void sendContactMessage_withXRealIp_extractsRealIp() throws Exception {
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .header("X-Real-IP", "198.51.100.42"))
                .andExpect(status().isOk())
                .andExpect(content().string("Message sent successfully!"));

        verify(rateLimiterService).checkAndRecord(eq("198.51.100.42"));
    }

    @Test
    @DisplayName("Falls back to remote address when no forwarded headers exist")
    void sendContactMessage_withoutProxyHeaders_usesRemoteAddr() throws Exception {
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .with(request -> {
                            request.setRemoteAddr("192.0.2.1");
                            return request;
                        }))
                .andExpect(status().isOk());

        verify(rateLimiterService).checkAndRecord(eq("192.0.2.1"));
    }

    @Test
    @DisplayName("Rate limits independent users correctly so one user does not block others")
    void sendContactMessage_rateLimitsPerIndividualClientIp() throws Exception {
        String clientA = "10.0.0.1";
        String clientB = "10.0.0.2";

        // Client A: 1st request -> OK
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .header("X-Forwarded-For", clientA))
                .andExpect(status().isOk());

        // Client A: 2nd request -> OK (limit is 2)
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .header("X-Forwarded-For", clientA))
                .andExpect(status().isOk());

        // Client A: 3rd request -> 429 Too Many Requests
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .header("X-Forwarded-For", clientA))
                .andExpect(status().isTooManyRequests());

        // Client B: 1st request -> Still OK! Client B is not blocked by Client A
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .header("X-Forwarded-For", clientB))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Refunds rate limit attempt if mail delivery fails")
    void sendContactMessage_mailFailure_refundsQuota() throws Exception {
        String clientIp = "172.16.0.50";
        doThrow(new MailSendException("SMTP error")).when(contactService).sendContactMessage(any());

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest))
                        .header("X-Forwarded-For", clientIp))
                .andExpect(status().isServiceUnavailable());

        verify(rateLimiterService).refund(eq(clientIp));
    }
}
