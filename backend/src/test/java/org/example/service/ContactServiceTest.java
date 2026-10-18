package org.example.service;

import org.example.dto.ContactRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock
    private JavaMailSender javaMailSender;

    @InjectMocks
    private ContactService contactService;

    @Test
    @DisplayName("Throws IllegalStateException when fromEmail (MAIL_USERNAME) is not configured")
    void sendContactMessage_unconfiguredFromEmail_throwsException() {
        ReflectionTestUtils.setField(contactService, "fromEmail", "");
        ReflectionTestUtils.setField(contactService, "recipientEmail", "recipient@example.com");

        ContactRequest request = new ContactRequest("Alice", "alice@example.com", "Hello", "Test message content");

        assertThatThrownBy(() -> contactService.sendContactMessage(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MAIL_USERNAME is missing");
    }

    @Test
    @DisplayName("Throws IllegalStateException when recipientEmail is not configured")
    void sendContactMessage_unconfiguredRecipient_throwsException() {
        ReflectionTestUtils.setField(contactService, "fromEmail", "sender@gmail.com");
        ReflectionTestUtils.setField(contactService, "recipientEmail", "");

        ContactRequest request = new ContactRequest("Alice", "alice@example.com", "Hello", "Test message content");

        assertThatThrownBy(() -> contactService.sendContactMessage(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MAIL_RECIPIENT is missing");
    }

    @Test
    @DisplayName("Dispatches email with correct From, To, Reply-To, and Subject when configured")
    void sendContactMessage_validCredentials_dispatchesMessage() {
        ReflectionTestUtils.setField(contactService, "fromEmail", "sender@gmail.com");
        ReflectionTestUtils.setField(contactService, "recipientEmail", "owner@gmail.com");

        ContactRequest request = new ContactRequest("Alice", "alice@example.com", "Job Opportunity", "We want to hire you for a Spring Boot role.");

        contactService.sendContactMessage(request);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(javaMailSender).send(captor.capture());

        SimpleMailMessage sentMessage = captor.getValue();
        assertThat(sentMessage.getFrom()).isEqualTo("sender@gmail.com");
        assertThat(sentMessage.getTo()).containsExactly("owner@gmail.com");
        assertThat(sentMessage.getReplyTo()).isEqualTo("alice@example.com");
        assertThat(sentMessage.getSubject()).isEqualTo("Portfolio Contact: Job Opportunity");
        assertThat(sentMessage.getText()).contains("Alice", "alice@example.com", "We want to hire you");
    }
}
