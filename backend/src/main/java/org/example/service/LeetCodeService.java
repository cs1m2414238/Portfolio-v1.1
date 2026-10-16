package org.example.service;

import org.example.model.CodingProfile;
import org.example.model.Metric;
import org.example.model.Platform;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.text.NumberFormat;
import java.util.*;

import static org.springframework.http.MediaType.APPLICATION_JSON;

@Service
public class LeetCodeService {

    private final RestTemplate restTemplate = new RestTemplate();

    public CodingProfile getProfile() {

        String username = "9sY5neJGk8";

        String url = "https://leetcode.com/graphql";

        String query = """
            query GetLeetCodeProfile($username: String!) {

                matchedUser(username: $username) {

                    username

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

        System.out.println("LEETCODE RESPONSE = " + responseBody);

        return parseResponse(responseBody, username);
    }

    private CodingProfile parseResponse(Map<String, Object> responseBody, String username) {
        if (responseBody == null || !responseBody.containsKey("data")) {
            throw new RuntimeException("Empty or invalid LeetCode response");
        }

        Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
        if (data == null || data.get("matchedUser") == null) {
            throw new RuntimeException("LeetCode user not found: " + username);
        }

        Map<String, Object> matchedUser = (Map<String, Object>) data.get("matchedUser");
        Map<String, Object> submitStats = (Map<String, Object>) matchedUser.get("submitStats");

        int totalSolved = 0;
        int easySolved = 0;
        int mediumSolved = 0;
        int hardSolved = 0;

        if (submitStats != null && submitStats.get("acSubmissionNum") instanceof List<?> acList) {
            for (Object itemObj : acList) {
                if (itemObj instanceof Map<?, ?> item) {
                    String diff = String.valueOf(item.get("difficulty"));
                    int count = item.get("count") instanceof Number n ? n.intValue() : 0;
                    if ("All".equalsIgnoreCase(diff)) totalSolved = count;
                    else if ("Easy".equalsIgnoreCase(diff)) easySolved = count;
                    else if ("Medium".equalsIgnoreCase(diff)) mediumSolved = count;
                    else if ("Hard".equalsIgnoreCase(diff)) hardSolved = count;
                }
            }
        }

        Map<String, Object> contest = (Map<String, Object>) data.get("userContestRanking");
        String ratingStr = "-";
        String rankStr = "-";
        String badge = "Knight";
        Integer streak = 41;

        NumberFormat numFmt = NumberFormat.getIntegerInstance(Locale.US);

        if (contest != null) {
            if (contest.get("rating") instanceof Number r) {
                ratingStr = numFmt.format(Math.round(r.doubleValue()));
            }
            if (contest.get("topPercentage") instanceof Number tp) {
                rankStr = String.format(Locale.US, "Top %.1f%%", tp.doubleValue());
            } else if (contest.get("globalRanking") instanceof Number gr) {
                rankStr = "#" + numFmt.format(gr.longValue());
            }
        }

        List<Metric> metrics = new ArrayList<>();
        metrics.add(new Metric("Problems Solved", String.valueOf(totalSolved), "Easy: " + easySolved + " | Med: " + mediumSolved + " | Hard: " + hardSolved));
        metrics.add(new Metric("Contest Rating", ratingStr, rankStr));
        metrics.add(new Metric("Streak", streak != null ? streak.toString() : "41", "Days Active"));

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
