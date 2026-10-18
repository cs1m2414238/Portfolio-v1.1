package org.example.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.model.CodingProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@RestClientTest(GeeksforGeeksService.class)
class GeeksforGeeksServiceTest {
    @Autowired private GeeksforGeeksService service;
    @Autowired private MockRestServiceServer server;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void readsProfileAndActivityStatisticsIncludingARealZeroCurrentStreak() throws JsonProcessingException {
        respond("2k24cs1mvgrc", """
                {"total_problems_solved":12,"score":38,"institute_rank":516,
                 "pod_solved_current_streak":0,"pod_solved_longest_streak":1,"pod_correct_submissions_count":5}
                """, false);
        CodingProfile profile = service.getProfile();
        assertEquals("2k24cs1mvgrc", profile.getUsername());
        assertEquals(GeeksforGeeksService.PROFILE_URL, profile.getProfileUrl());
        assertEquals(12, profile.getProblemsSolved());
        assertEquals("38", profile.getRating());
        assertEquals("Institute Rank 516", profile.getGlobalRank());
        assertEquals(0, profile.getStreak());
        assertEquals("38", profile.getMetrics().get(2).getValue());
        assertEquals("1", profile.getMetrics().get(4).getValue());
        assertEquals("5", profile.getMetrics().get(5).getValue());
        server.verify();
    }

    @Test
    void joinsStatsSplitAcrossReactFlightPackets() throws JsonProcessingException {
        respond("2k24cs1mvgrc", "{\"total_problems_solved\":12,\"score\":38}", true);
        assertEquals(12, service.getProfile().getProblemsSolved());
    }

    @Test
    void acceptsZeroSolvedAndDoesNotInventMissingRankOrStreak() throws JsonProcessingException {
        respond("2k24cs1mvgrc", "{\"total_problems_solved\":0,\"score\":0,\"institute_rank\":null}", false);
        CodingProfile profile = service.getProfile();
        assertEquals(0, profile.getProblemsSolved());
        assertEquals("0", profile.getRating());
        assertEquals("-", profile.getGlobalRank());
        assertNull(profile.getStreak());
    }

    @Test
    void rejectsAnotherAccount() throws JsonProcessingException {
        respond("someone_else", "{\"total_problems_solved\":12}", false);
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    @Test
    void rejectsMissingSolvedCount() throws JsonProcessingException {
        respond("2k24cs1mvgrc", "{\"score\":38}", false);
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    @Test
    void rejectsInvalidCounts() throws JsonProcessingException {
        respond("2k24cs1mvgrc", "{\"total_problems_solved\":-1}", false);
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    @Test
    void rejectsAccessDeniedPageInsteadOfReturningZero() {
        server.expect(requestTo(GeeksforGeeksService.ACTIVITY_URL))
                .andRespond(withSuccess("<html>Access denied</html>", MediaType.TEXT_HTML));
        assertThrows(IllegalStateException.class, service::getProfile);
    }

    private void respond(String username, String stats, boolean split) throws JsonProcessingException {
        String flight = "6:[\"$\",\"$L2e\",null,{\"username\":\"" + username + "\",\"articleCount\":" + stats.replace("\n", " ") + "}]\n";
        String html;
        if (split) {
            int middle = flight.length() / 2;
            html = packet(flight.substring(0, middle)) + packet(flight.substring(middle));
        } else html = packet(flight);
        server.expect(requestTo(GeeksforGeeksService.ACTIVITY_URL)).andRespond(withSuccess(html, MediaType.TEXT_HTML));
    }

    private String packet(String text) throws JsonProcessingException {
        return "<script>self.__next_f.push(" + objectMapper.writeValueAsString(List.of(1, text)) + ")</script>";
    }
}
