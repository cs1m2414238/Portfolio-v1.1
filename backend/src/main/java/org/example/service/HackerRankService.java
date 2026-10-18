package org.example.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.model.CodingProfile;
import org.example.model.Metric;
import org.example.model.Platform;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class HackerRankService {
    static final String USERNAME = "cs1m_2414238";
    static final String PROFILE_URL = "https://www.hackerrank.com/profile/" + USERNAME;
    static final String HISTORY_URL = "https://www.hackerrank.com/rest/hackers/" + USERNAME + "/recent_challenges?limit=20";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public HackerRankService(RestTemplateBuilder builder, ObjectMapper objectMapper) {
        restTemplate = builder.connectTimeout(Duration.ofSeconds(2)).readTimeout(Duration.ofSeconds(3)).build();
        this.objectMapper = objectMapper;
    }

    public CodingProfile getProfile() {
        long deadline = System.nanoTime() + Duration.ofSeconds(18).toNanos();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0");
        HttpEntity<Void> request = new HttpEntity<>(headers);
        String html = restTemplate.exchange(PROFILE_URL, HttpMethod.GET, request, String.class).getBody();
        Element initialData = html == null ? null : Jsoup.parse(html).getElementById("initialData");
        if (initialData == null) throw new IllegalStateException("HackerRank profile data is missing");

        JsonNode profile;
        try {
            JsonNode state = objectMapper.readTree(URLDecoder.decode(initialData.data().trim(), StandardCharsets.UTF_8));
            profile = state.path("community").path("viewProfiles").path(USERNAME);
        } catch (JsonProcessingException | IllegalArgumentException error) {
            throw new IllegalStateException("Invalid HackerRank profile data", error);
        }
        if (!USERNAME.equals(profile.path("username").asText()) || profile.path("deleted").asBoolean()
                || !profile.path("badges").isArray() || !profile.path("scores").isObject()) {
            throw new IllegalStateException("HackerRank profile not found or incomplete: " + USERNAME);
        }

        int badges = 0;
        int stars = 0;
        for (JsonNode badge : profile.path("badges")) {
            int earnedStars = badge.path("stars").asInt(0);
            if (earnedStars > 0) badges++;
            stars = Math.max(stars, earnedStars);
        }
        BigDecimal score = BigDecimal.ZERO;
        for (JsonNode domain : profile.path("scores")) {
            JsonNode points = domain.path("practice").path("score");
            if (points.isNumber()) score = score.add(points.decimalValue());
        }
        String scoreText = score.stripTrailingZeros().toPlainString();
        int solved = countCompletedChallenges(request, deadline);
        String topBadge = stars + "\u2605";

        return CodingProfile.builder()
                .platform(Platform.HACKERRANK).name("HackerRank").username(USERNAME).profileUrl(PROFILE_URL)
                .avatarUrl(profile.path("avatar").asText(null))
                .problemsSolved(solved).rating(topBadge).badge(Integer.toString(badges)).globalRank("-").active(true)
                .metrics(List.of(
                        new Metric("Problems Solved", Integer.toString(solved), "Unique Completed Challenges"),
                        new Metric("Top Badge", topBadge, "Highest Earned Badge"),
                        new Metric("Badges", Integer.toString(badges), "Earned Badges"),
                        new Metric("Score", scoreText, "Total Practice Score")
                )).build();
    }

    private int countCompletedChallenges(HttpEntity<Void> request, long deadline) {
        Set<String> completed = new HashSet<>();
        Set<String> cursors = new HashSet<>();
        String cursor = null;
        // Never publish a partial count if pagination fails, cycles, or exceeds the refresh budget.
        for (int page = 0; page < 100; page++) {
            if (System.nanoTime() >= deadline) throw new IllegalStateException("HackerRank history fetch timed out");
            String url = HISTORY_URL + (cursor == null ? "&offset=0" : "&cursor=" + URLEncoder.encode(cursor, StandardCharsets.UTF_8));
            JsonNode history = restTemplate.exchange(URI.create(url), HttpMethod.GET, request, JsonNode.class).getBody();
            if (history == null || !history.path("models").isArray() || !history.path("last_page").isBoolean()) {
                throw new IllegalStateException("Invalid HackerRank challenge history");
            }
            for (JsonNode challenge : history.path("models")) {
                String slug = challenge.path("ch_slug").asText("");
                if (slug.isBlank()) throw new IllegalStateException("HackerRank challenge is missing its identifier");
                completed.add(challenge.path("con_slug").asText("master") + "/" + slug);
            }
            if (history.path("last_page").asBoolean()) return completed.size();
            cursor = history.path("cursor").asText("");
            if (cursor.isBlank() || !cursors.add(cursor)) {
                throw new IllegalStateException("HackerRank challenge history is incomplete");
            }
        }
        throw new IllegalStateException("HackerRank challenge history exceeded the pagination limit");
    }
}
