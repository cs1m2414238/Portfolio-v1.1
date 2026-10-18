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

@RestClientTest(LeetCodeService.class)
class LeetCodeServiceTest {

    @Autowired
    private LeetCodeService service;

    @Autowired
    private MockRestServiceServer server;

    @Test
    void readsSolvedCountFromLiveResponse() {
        respond("""
                {"data": {
                  "matchedUser": {"userCalendar":{"streak":97}, "submitStats": {"acSubmissionNum": [
                    {"difficulty": "Easy", "count": 133},
                    {"difficulty": "All", "count": 356},
                    {"difficulty": "Medium", "count": 192},
                    {"difficulty": "Hard", "count": 31}
                  ]}},
                  "userContestRanking": {"rating": 1481.0657, "topPercentage": 50.84,
                    "attendedContestsCount":14,"globalRanking":447782,"badge":null}
                }}
                """);

        CodingProfile profile = service.getProfile();

        assertEquals(356, profile.getProblemsSolved());
        assertEquals("356", profile.getMetrics().get(0).getValue());
        assertEquals("Easy: 133 | Med: 192 | Hard: 31", profile.getMetrics().get(0).getSubtext());
        assertEquals("1,481", profile.getRating());
        assertNull(profile.getBadge());
        assertEquals("Top 50.84%", profile.getGlobalRank());
        assertEquals(97, profile.getStreak());
        assertEquals("14", profile.getMetrics().stream().filter(metric -> metric.getLabel().equals("Contests")).findFirst().orElseThrow().getValue());
        server.verify();
    }

    @Test
    void displaysOnlyABadgeActuallyAwardedByLeetCode() {
        respond("""
                {"data":{"matchedUser":{"submitStats":{"acSubmissionNum":[{"difficulty":"All","count":356}]}},
                 "userContestRanking":{"rating":1901.4,"attendedContestsCount":20,"badge":{"name":"Knight"}}}}
                """);
        CodingProfile profile = service.getProfile();
        assertEquals("Knight", profile.getBadge());
        assertEquals("1,901", profile.getRating());
        assertNull(profile.getStreak());
    }

    @Test
    void missingContestHistoryDoesNotInventARatingBadgeOrStreak() {
        respond("""
                {"data":{"matchedUser":{"submitStats":{"acSubmissionNum":[{"difficulty":"All","count":0}]}},
                 "userContestRanking":null}}
                """);
        CodingProfile profile = service.getProfile();
        assertEquals("Unrated", profile.getRating());
        assertNull(profile.getBadge());
        assertNull(profile.getStreak());
    }

    @Test
    void rejectsMissingCountInsteadOfReplacingCachedValueWithZero() {
        respond("""
                {"data": {"matchedUser": {"submitStats": {"acSubmissionNum": []}}}}
                """);

        assertThrows(IllegalStateException.class, service::getProfile);
        server.verify();
    }

    @Test
    void rejectsGraphQlErrorsEvenWhenResponseContainsData() {
        respond("""
                {"data": {"matchedUser": null}, "errors": [{"message": "Rate limited"}]}
                """);

        IllegalStateException error = assertThrows(IllegalStateException.class, service::getProfile);
        assertTrue(error.getMessage().contains("Rate limited"));
        server.verify();
    }

    @Test
    void acceptsARealZeroSolvedCount() {
        respond("""
                {"data": {"matchedUser": {"submitStats": {"acSubmissionNum": [
                  {"difficulty": "All", "count": 0}
                ]}}}}
                """);

        assertEquals(0, service.getProfile().getProblemsSolved());
        server.verify();
    }

    private void respond(String body) {
        server.expect(requestTo("https://leetcode.com/graphql"))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
    }
}
