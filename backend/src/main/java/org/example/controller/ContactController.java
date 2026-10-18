package org.example.controller;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.ContactRequest;
import org.example.service.ContactService;
import org.example.service.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/contact")
public class ContactController {

    private static final Logger log = LoggerFactory.getLogger(ContactController.class);

    private final ContactService contactService;
    private final RateLimiterService rateLimiterService;

    @PostMapping
    public ResponseEntity<String> sendContactMessage(
            @Valid @RequestBody ContactRequest contactRequest, HttpServletRequest request){

        String clientIp = extractClientIp(request);

        rateLimiterService.checkAndRecord(clientIp);

        try {
            contactService.sendContactMessage(contactRequest);
            return ResponseEntity.ok("Message sent successfully!");
        } catch (Exception e) {
            log.error("Failed to send contact message from IP {}: {}", clientIp, e.getMessage(), e);
            rateLimiterService.refund(clientIp);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to send message: " + (e.getMessage() != null ? e.getMessage() : "Please try again later.")
            );
        }
    }

    // Extract the client IP, prioritizing X-Forwarded-For and X-Real-IP when behind a reverse proxy
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
