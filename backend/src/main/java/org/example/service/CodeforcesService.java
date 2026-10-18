package org.example.service;

import org.example.model.CodingProfile;
import org.example.model.Metric;
import org.example.model.Platform;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CodeforcesService {

    private final RestTemplate restTemplate;

    public CodeforcesService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofSeconds(5))
                .build();
    }

    public CodingProfile getProfile() {
        String handle = "Unexpectedpriyanshu";


        String userUrl = "https://codeforces.com/api/user.info?handles=" + handle;
        Map<String, Object> response = restTemplate.getForObject(userUrl, Map.class);

        if (response == null || !"OK".equals(response.get("status"))) {
            throw new RuntimeException("Failed to fetch Codeforces profile");
        }

        // Cast the raw API result into a list of user objects
        List<Map<String, Object>> result = (List<Map<String, Object>>) response.get("result");
        if (result == null || result.isEmpty()) {
            throw new RuntimeException("No Codeforces user data returned");
        }

        Map<String, Object> user = result.get(0);

        Integer rating = (Integer) user.get("rating");
        Integer maxRating = (Integer) user.get("maxRating");
        String rank = (String) user.get("rank");

        int problemsSolved = getSolvedProblems(handle);

        return CodingProfile.builder()
                .platform(Platform.CODEFORCES)
                .name("Codeforces")
                .username(handle)
                .profileUrl("https://codeforces.com/profile/" + handle)
                .problemsSolved(problemsSolved)
                .rating(rating != null ? rating.toString() : "-")
                .globalRank(rank)
                .badge(rank)
                .metrics(List.of(
                        new Metric(
                                "Problems Solved",
                                String.valueOf(problemsSolved),
                                "Accepted Problems"
                        ),
                        new Metric(
                                "Rating",
                                rating != null ? rating.toString() : "-",
                                rank != null ? rank : "-"
                        ),
                        new Metric(
                                "Max Rating",
                                maxRating != null ? maxRating.toString() : "-",
                                "Personal Best"
                        )
                ))
                .active(true)
                .build();
    }

    private int getSolvedProblems(String handle) {
        try {
            String url = "https://codeforces.com/api/user.status?handle=" + handle;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || !"OK".equals(response.get("status"))) {
                return 4;
            }

            List<Map<String, Object>> submissions = (List<Map<String, Object>>) response.get("result");
            if (submissions == null) {
                return 0;
            }

            Set<String> solved = new HashSet<>();
            for (Map<String, Object> submission : submissions) {
                String verdict = (String) submission.get("verdict");
                if (!"OK".equals(verdict)) {
                    continue;
                }

                Map<String, Object> problem = (Map<String, Object>) submission.get("problem");
                if (problem == null) {
                    continue;
                }

                Object contestId = problem.get("contestId");
                String index = (String) problem.get("index");
                if (index != null) {
                    String uniqueProblem = (contestId != null ? contestId.toString() : "gym") + "-" + index;
                    solved.add(uniqueProblem);
                }
            }

            return solved.size();
        } catch (Exception e) {
            System.err.println("Failed to fetch Codeforces solved problems: " + e.getMessage());
            return 4;
        }
    }
}
