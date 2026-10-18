package org.example.service;

import org.example.model.CodingProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@RestClientTest(HackerRankService.class)
class HackerRankServiceTest {
    @Autowired private HackerRankService service;
    @Autowired private MockRestServiceServer server;

    @Test
    void followsEveryHistoryPageDeduplicatesChallengesAndReadsBadgesAndScore() {
        profile();
        history("&offset=0", """
                {"models":[{"ch_slug":"one","con_slug":"master"},{"ch_slug":"two","con_slug":"master"}],
                 "cursor":"next/page+1=","last_page":false}
                """);
        history("&cursor=next%2Fpage%2B1%3D", """
                {"models":[{"ch_slug":"two","con_slug":"master"},{"ch_slug":"three","con_slug":"master"}],"last_page":true}
                """);
        CodingProfile profile = service.getProfile();
        assertEquals(3, profile.getProblemsSolved());
        assertEquals("cs1m_2414238", profile.getUsername());
        assertEquals(HackerRankService.PROFILE_URL, profile.getProfileUrl());
        assertEquals("4\u2605", profile.getRating());
        assertEquals("2", profile.getBadge());
        assertEquals("Top Badge", profile.getMetrics().get(1).getLabel());
        assertEquals("632.44", profile.getMetrics().get(3).getValue());
        server.verify();
    }

    @Test
    void acceptsEmptyCompletedHistory() {
        profile();
        history("&offset=0", "{\"models\":[],\"last_page\":true}");
        assertEquals(0, service.getProfile().getProblemsSolved());
    }

    @Test
    void rejectsPartialHistoryRatherThanPublishingAnUndercount() {
        profile();
        history("&offset=0", "{\"models\":[{\"ch_slug\":\"one\"}],\"last_page\":false}");
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    @Test
    void rejectsRepeatedPaginationCursor() {
        profile();
        history("&offset=0", "{\"models\":[{\"ch_slug\":\"one\"}],\"cursor\":\"next\",\"last_page\":false}");
        history("&cursor=next", "{\"models\":[{\"ch_slug\":\"one\"}],\"cursor\":\"next\",\"last_page\":false}");
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    @Test
    void rejectsMalformedHistory() {
        profile();
        history("&offset=0", "{\"message\":\"Rate limited\"}");
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    @Test
    void propagatesUpstreamFailureForLastGoodSnapshotFallback() {
        profile();
        server.expect(requestTo(HackerRankService.HISTORY_URL + "&offset=0")).andRespond(withServerError());
        assertThrows(RuntimeException.class, service::getProfile);
    }

    @Test
    void rejectsMissingProfileData() {
        server.expect(requestTo(HackerRankService.PROFILE_URL)).andRespond(withSuccess("<html>Access denied</html>", MediaType.TEXT_HTML));
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    private void profile() {
        String state = """
                {"community":{"viewProfiles":{"cs1m_2414238":{
                  "username":"cs1m_2414238","deleted":false,
                  "badges":[{"stars":4,"solved":20},{"stars":3,"solved":16},{"stars":0,"solved":0}],
                  "scores":{"algorithms":{"practice":{"score":481}},"java":{"practice":{"score":151.44}}}
                }}}}
                """;
        String html = "<script type='application/json' id='initialData'>" + URLEncoder.encode(state, StandardCharsets.UTF_8) + "</script>";
        server.expect(requestTo(HackerRankService.PROFILE_URL)).andRespond(withSuccess(html, MediaType.TEXT_HTML));
    }

    private void history(String suffix, String json) {
        server.expect(requestTo(HackerRankService.HISTORY_URL + suffix)).andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
    }
}
