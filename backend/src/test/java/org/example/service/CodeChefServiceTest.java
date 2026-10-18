package org.example.service;

import org.example.model.CodingProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@RestClientTest(CodeChefService.class)
class CodeChefServiceTest {
    @Autowired private CodeChefService service;
    @Autowired private MockRestServiceServer server;

    @Test
    void readsSolvedCountForAnUnratedAccount() {
        respond("<div class='user-details-container'><span>unexpected628</span><h3>Total Problems Solved: 78</h3></div>");
        CodingProfile profile = service.getProfile();
        assertEquals("unexpected628", profile.getUsername());
        assertEquals(78, profile.getProblemsSolved());
        assertEquals("Unrated", profile.getRating());
        assertEquals("Unrated", profile.getBadge());
        assertEquals("-", profile.getGlobalRank());
        assertEquals("Global Rank", profile.getMetrics().get(3).getLabel());
        server.verify();
    }

    @Test
    void readsPublishedRatingDivisionAndRank() {
        respond("""
                <div class='user-details-container'>unexpected628<h3>Total Problems Solved: 1,234</h3></div>
                <div class='rating-header'><div class='rating-number'>1540</div><small>(Div 3)</small></div>
                <div class='rating-ranks'><ul><li><strong>12,345</strong>Global Rank</li><li><strong>678</strong>Country Rank</li></ul></div>
                """);
        CodingProfile profile = service.getProfile();
        assertEquals(1234, profile.getProblemsSolved());
        assertEquals("1540", profile.getRating());
        assertEquals("Div 3", profile.getBadge());
        assertEquals("12,345", profile.getGlobalRank());
        server.verify();
    }

    @Test
    void acceptsARealZero() {
        respond("<div class='user-details-container'>unexpected628<h3>Total Problems Solved: 0</h3></div>");
        assertEquals(0, service.getProfile().getProblemsSolved());
    }

    @Test
    void rejectsMissingCountAndBotPagesInsteadOfReportingZero() {
        respond("<div class='user-details-container'>unexpected628</div>");
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    @Test
    void rejectsAnotherAccount() {
        respond("<div class='user-details-container'>someone_else<h3>Total Problems Solved: 78</h3></div>");
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    private void respond(String html) {
        server.expect(requestTo(CodeChefService.PROFILE_URL)).andRespond(withSuccess(html, MediaType.TEXT_HTML));
    }
}
