package org.example.service;

import org.example.model.CodingProfile;
import org.example.model.Metric;
import org.example.model.Platform;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.text.NumberFormat;
import java.time.Duration;
import java.util.*;

import static org.springframework.http.MediaType.APPLICATION_JSON;

@Service
public class LeetCodeService {

    private static final Logger log = LoggerFactory.getLogger(LeetCodeService.class);
    private final RestTemplate restTemplate;

    public LeetCodeService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofSeconds(5))
                .build();
    }

    public CodingProfile getProfile() {

        String username = "9sY5neJGk8";

        String url = "https://leetcode.com/graphql";

        String query = """
            query GetLeetCodeProfile($username: String!) {

                matchedUser(username: $username) {

                    username

                    userCalendar {
                        streak
                    }

                    submitStats: submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                }

                userContestRanking(username: $username) {
                    attendedContestsCount
                    rating
                    globalRanking
                    topPercentage
                    badge {
                        name
                    }
                }
            }
        """;

        Map<String, Object> variables = new HashMap<>();
        variables.put("username", username);

        Map<String, Object> body = new HashMap<>();
        body.put("query", query);
        body.put("variables", variables);

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(APPLICATION_JSON);

        headers.set(
                "User-Agent",
                "Mozilla/5.0"
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        request,
                        Map.class
                );

        Map<String, Object> responseBody = response.getBody();

        log.debug("LeetCode raw response: {}", responseBody);

        return parseResponse(responseBody, username);
    }

    private CodingProfile parseResponse(Map<String, Object> responseBody, String username) {
        if (responseBody == null || !responseBody.containsKey("data")) {
            throw new RuntimeException("Empty or invalid LeetCode response");
        }
        if (responseBody.get("errors") instanceof List<?> errors && !errors.isEmpty()) {
            throw new IllegalStateException("LeetCode GraphQL errors: " + errors);
        }

        Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
        if (data == null || data.get("matchedUser") == null) {
            throw new RuntimeException("LeetCode user not found: " + username);
        }

        Map<String, Object> matchedUser = (Map<String, Object>) data.get("matchedUser");
        Map<String, Object> submitStats = (Map<String, Object>) matchedUser.get("submitStats");

        Integer totalSolved = null;
        int easySolved = 0;
        int mediumSolved = 0;
        int hardSolved = 0;

        if (submitStats != null && submitStats.get("acSubmissionNum") instanceof List<?> acList) {
            for (Object itemObj : acList) {
                if (itemObj instanceof Map<?, ?> item) {
                    String diff = String.valueOf(item.get("difficulty"));
                    if (!(item.get("count") instanceof Number n) || n.intValue() < 0) continue;
                    int count = n.intValue();
                    if ("All".equalsIgnoreCase(diff)) totalSolved = count;
                    else if ("Easy".equalsIgnoreCase(diff)) easySolved = count;
                    else if ("Medium".equalsIgnoreCase(diff)) mediumSolved = count;
                    else if ("Hard".equalsIgnoreCase(diff)) hardSolved = count;
                }
            }
        }

        if (totalSolved == null) {
            throw new IllegalStateException("LeetCode response is missing the total solved count");
        }

        Map<String, Object> contest = (Map<String, Object>) data.get("userContestRanking");
        String ratingStr = "Unrated";
        String rankStr = "-";
        String badge = null;
        Integer streak = null;
        int contests = 0;
        String globalRank = "-";

        if (matchedUser.get("userCalendar") instanceof Map<?, ?> calendar
                && calendar.get("streak") instanceof Number days && days.intValue() >= 0) {
            streak = days.intValue();
        }

        NumberFormat numFmt = NumberFormat.getIntegerInstance(Locale.US);

        if (contest != null) {
            if (contest.get("attendedContestsCount") instanceof Number attended && attended.intValue() >= 0) {
                contests = attended.intValue();
            }
            if (contest.get("rating") instanceof Number r) {
                ratingStr = numFmt.format(Math.round(r.doubleValue()));
            }
            if (contest.get("topPercentage") instanceof Number tp) {
                rankStr = String.format(Locale.US, "Top %.2f%%", tp.doubleValue());
            }
            if (contest.get("globalRanking") instanceof Number gr) {
                globalRank = "#" + numFmt.format(gr.longValue());
                if ("-".equals(rankStr)) rankStr = globalRank;
            }
            if (contest.get("badge") instanceof Map<?, ?> earnedBadge && earnedBadge.get("name") instanceof String name) {
                badge = name;
            }
        }

        List<Metric> metrics = new ArrayList<>();
        metrics.add(new Metric("Problems Solved", String.valueOf(totalSolved), "Easy: " + easySolved + " | Med: " + mediumSolved + " | Hard: " + hardSolved));
        metrics.add(new Metric("Contest Rating", ratingStr, rankStr));
        metrics.add(new Metric("Contests", Integer.toString(contests), "Rated Contests Attended"));
        metrics.add(new Metric("Global Rank", globalRank, "Contest Global Rank"));
        metrics.add(new Metric("Max Streak", streak != null ? streak.toString() : "-", "Days"));

        return CodingProfile.builder()
                .platform(Platform.LEETCODE)
                .name("LeetCode")
                .username(username)
                .profileUrl("https://leetcode.com/u/" + username + "/")
                .problemsSolved(totalSolved)
                .rating(ratingStr)
                .globalRank(rankStr)
                .badge(badge)
                .streak(streak)
                .metrics(metrics)
                .active(true)
                .build();
    }
}
