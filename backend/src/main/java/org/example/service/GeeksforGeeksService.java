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

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class GeeksforGeeksService {
    static final String USERNAME = "2k24cs1mvgrc";
    static final String PROFILE_URL = "https://www.geeksforgeeks.org/profile/" + USERNAME;
    static final String ACTIVITY_URL = PROFILE_URL + "?tab=activity";
    private static final String FLIGHT_PUSH = "self.__next_f.push(";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeeksforGeeksService(RestTemplateBuilder builder, ObjectMapper objectMapper) {
        restTemplate = builder.connectTimeout(Duration.ofSeconds(2)).readTimeout(Duration.ofSeconds(4)).build();
        this.objectMapper = objectMapper;
    }

    public CodingProfile getProfile() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0");
        String html = restTemplate.exchange(ACTIVITY_URL, HttpMethod.GET, new HttpEntity<>(headers), String.class).getBody();
        if (html == null) throw new IllegalStateException("Empty GeeksforGeeks profile response");
        JsonNode stats = readStats(html);
        int solved = requiredCount(stats, "total_problems_solved");
        Integer score = optionalCount(stats, "score");
        Integer rank = optionalCount(stats, "institute_rank");
        Integer streak = optionalCount(stats, "pod_solved_current_streak");

        List<Metric> metrics = new ArrayList<>();
        metrics.add(new Metric("Problems Solved", Integer.toString(solved), "Total Solved"));
        metrics.add(new Metric("Institute Rank", value(rank), "Institute Rank"));
        metrics.add(new Metric("Coding Score", value(score), "Practice Score"));
        metrics.add(new Metric("POTD Streak", value(streak), "Current Streak (Days)"));
        metrics.add(new Metric("Longest Streak", value(optionalCount(stats, "pod_solved_longest_streak")), "Days"));
        metrics.add(new Metric("POTDs Solved", value(optionalCount(stats, "pod_correct_submissions_count")), "Accepted POTDs"));

        return CodingProfile.builder()
                .platform(Platform.GEEKSFORGEEKS).name("GeeksforGeeks").username(USERNAME).profileUrl(PROFILE_URL)
                .avatarUrl(stats.path("profile_image_url").asText(null))
                .problemsSolved(solved).rating(value(score))
                .globalRank(rank == null ? "-" : "Institute Rank " + rank)
                .streak(streak).active(true).metrics(metrics).build();
    }

    private JsonNode readStats(String html) {
        // Parse Next.js data as JSON only; never evaluate scripts from the profile page.
        StringBuilder flight = new StringBuilder();
        for (Element script : Jsoup.parse(html).select("script")) {
            String text = script.data().trim();
            if (!text.startsWith(FLIGHT_PUSH)) continue;
            int end = text.lastIndexOf(')');
            if (end < FLIGHT_PUSH.length()) continue;
            try {
                JsonNode packet = objectMapper.readTree(text.substring(FLIGHT_PUSH.length(), end));
                if (packet.isArray() && packet.path(0).asInt(-1) == 1 && packet.path(1).isTextual()) {
                    flight.append(packet.path(1).textValue());
                }
            } catch (JsonProcessingException ignored) {
                // Unrelated or malformed packets cannot supply a valid profile snapshot.
            }
        }
        for (String record : flight.toString().split("\\n")) {
            if (!record.contains("\"total_problems_solved\"")) continue;
            int separator = record.indexOf(':');
            if (separator < 0) continue;
            try {
                JsonNode stats = findStats(objectMapper.readTree(record.substring(separator + 1)));
                if (stats != null) return stats;
            } catch (JsonProcessingException ignored) {
                // Other React Flight record types are not ordinary JSON.
            }
        }
        throw new IllegalStateException("GeeksforGeeks profile data is missing or belongs to another account");
    }

    private JsonNode findStats(JsonNode node) {
        if (node == null) return null;
        if (node.isObject() && USERNAME.equals(node.path("username").asText()) && node.path("articleCount").isObject()) {
            return node.path("articleCount");
        }
        if (node.isContainerNode()) {
            for (JsonNode child : node) {
                JsonNode match = findStats(child);
                if (match != null) return match;
            }
        }
        return null;
    }

    private int requiredCount(JsonNode stats, String field) {
        Integer value = optionalCount(stats, field);
        if (value == null) throw new IllegalStateException("GeeksforGeeks response is missing " + field);
        return value;
    }

    private Integer optionalCount(JsonNode stats, String field) {
        JsonNode value = stats.path(field);
        if (value.isMissingNode() || value.isNull()) return null;
        if (!value.isIntegralNumber() || !value.canConvertToInt() || value.intValue() < 0) {
            throw new IllegalStateException("Invalid GeeksforGeeks count: " + field);
        }
        return value.intValue();
    }

    private String value(Integer number) {
        return number == null ? "-" : number.toString();
    }
}
