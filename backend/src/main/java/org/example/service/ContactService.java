package org.example.service;

import org.example.dto.ContactRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.mail.recipient:${spring.mail.username:}}")
    private String recipientEmail;

    public ContactService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendContactMessage(ContactRequest request) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.error("MAIL_USERNAME is not configured in application environment");
            throw new IllegalStateException("Mail service is not configured: MAIL_USERNAME is missing on the server.");
        }
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.error("Recipient email is not configured in application environment");
            throw new IllegalStateException("Mail service is not configured: MAIL_RECIPIENT is missing on the server.");
        }

        log.info("Sending contact email from {} to {} for subject '{}'", fromEmail, recipientEmail, request.getSubject());

        SimpleMailMessage message = new SimpleMailMessage();

        // From MUST be set and match the authenticated Gmail username for Gmail SMTP
        message.setFrom(fromEmail);

        // Recipient who receives the contact email
        message.setTo(recipientEmail);

        // Reply-To enables replying directly to the person who submitted the form
        message.setReplyTo(request.getEmail());

        message.setSubject("Portfolio Contact: " + request.getSubject());

        message.setText(
            "New contact form submission received:\n\n" +
            "Sender Name: " + request.getName() + "\n" +
            "Sender Email: " + request.getEmail() + "\n" +
            "Subject: " + request.getSubject() + "\n\n" +
            "Message Body:\n" +
            request.getMessage() + "\n\n" +
            "---\nSent via Portfolio Contact Form"
        );

        javaMailSender.send(message);
        log.info("Contact email successfully dispatched to {}", recipientEmail);
    }
}
