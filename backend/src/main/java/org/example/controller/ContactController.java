package org.example.controller;


import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.ContactRequest;
import org.example.service.ContactService;
import org.example.service.RateLimiterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/contact")
public class ContactController {

    private final ContactService contactService;
    private final RateLimiterService rateLimiterService;

    @PostMapping
    public ResponseEntity<String> sendContactMessage(
            @Valid @RequestBody ContactRequest contactRequest, HttpServletRequest request){

        String clientIp = request.getRemoteAddr();

        rateLimiterService.checkAndRecord(clientIp);

        try{
            contactService.sendContactMessage(contactRequest);

            return ResponseEntity.ok(
                    "Message sent successfully!"
            );

        }catch (MailException mailException){
            rateLimiterService.refund(clientIp);
        }
        throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Unable to send message, Please try again"
        );
    }
}
