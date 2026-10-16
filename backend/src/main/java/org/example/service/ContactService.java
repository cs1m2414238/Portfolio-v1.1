package org.example.service;

import org.example.dto.ContactRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ContactService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.mail.recipient:${spring.mail.username:}}")
    private String recipientEmail;

    public ContactService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendContactMessage(ContactRequest request) {
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
    }
}
