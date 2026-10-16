package org.example.service;

import org.example.model.CodingProfile;
import org.example.model.Metric;
import org.example.model.Platform;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CodingProfileService {

    private final Map<Platform, CodingProfile> profileCache = new ConcurrentHashMap<>();
    private final CodeforcesService codeforcesService;
    private final LeetCodeService leetCodeService;

    public CodingProfileService(CodeforcesService codeforcesService, LeetCodeService leetCodeService) {
        this.codeforcesService = codeforcesService;
        this.leetCodeService = leetCodeService;
        initDefaultProfiles();
    }

    private void initDefaultProfiles() {
        // 1. LeetCode Profile
        CodingProfile leetCode = CodingProfile.builder()
                .platform(Platform.LEETCODE)
                .name("LeetCode")
                .username("9sY5neJGk8")
                .profileUrl("https://leetcode.com/u/9sY5neJGk8/")
                .problemsSolved(354)
                .rating("1,481")
                .globalRank("Top 50.8%")
                .badge("Knight")
                .streak(41)
                .active(true)
                .metrics(Arrays.asList(
                        new Metric("Problems Solved", "354", "Total Solved"),
                        new Metric("Contest Rating", "1,481", "Top 50.8%"),
                        new Metric("Streak", "41", "Days Active")
                ))
                .build();

        // 2. GeeksforGeeks Profile
        CodingProfile gfg = CodingProfile.builder()
                .platform(Platform.GEEKSFORGEEKS)
                .name("GeeksforGeeks")
                .username("cs1m2414238")
                .profileUrl("https://www.geeksforgeeks.org/user/cs1m2414238/")
                .problemsSolved(4)
                .rating("Rank 821")
                .globalRank("Institute Rank 821")
                .badge("Contributor")
                .streak(1)
                .active(false)
                .metrics(Arrays.asList(
                        new Metric("Problems Solved", "4", "Total Solved"),
                        new Metric("Institute Rank", "821", "Institute Rank »"),
                        new Metric("Coding Score", "10", "Score")
                ))
                .build();

        // 3. Codeforces Profile
        CodingProfile codeforces = CodingProfile.builder()
                .platform(Platform.CODEFORCES)
                .name("Codeforces")
                .username("Unexpectedpriyanshu")
                .profileUrl("https://codeforces.com/profile/Unexpectedpriyanshu")
                .problemsSolved(4)
                .rating("562")
                .globalRank("newbie")
                .badge("newbie")
                .streak(null)
                .active(true)
                .metrics(Arrays.asList(
                        new Metric("Problems Solved", "4", "Accepted Problems"),
                        new Metric("Rating", "562", "newbie"),
                        new Metric("Max Rating", "562", "Personal Best")
                ))
                .build();

        // 4. CodeChef Profile
        CodingProfile codechef = CodingProfile.builder()
                .platform(Platform.CODECHEF)
                .name("CodeChef")
                .username("cs1m2414238")
                .profileUrl("https://www.codechef.com/users/cs1m2414238")
                .problemsSolved(null)
                .rating("-")
                .globalRank("-")
                .badge("-")
                .streak(null)
                .active(false)
                .metrics(new ArrayList<>())
                .build();

        // 5. HackerRank Profile
        CodingProfile hackerrank = CodingProfile.builder()
                .platform(Platform.HACKERRANK)
                .name("HackerRank")
                .username("cs1m2414238")
                .profileUrl("https://www.hackerrank.com/cs1m2414238")
                .problemsSolved(null)
                .rating("-")
                .globalRank("-")
                .badge("-")
                .streak(null)
                .active(false)
                .metrics(new ArrayList<>())
                .build();

        profileCache.put(Platform.LEETCODE, leetCode);
        profileCache.put(Platform.GEEKSFORGEEKS, gfg);
        profileCache.put(Platform.CODEFORCES, codeforces);
        profileCache.put(Platform.CODECHEF, codechef);
        profileCache.put(Platform.HACKERRANK, hackerrank);
    }

    public List<CodingProfile> getAllProfiles() {
        return Arrays.asList(
                getProfile(Platform.LEETCODE),
                getProfile(Platform.GEEKSFORGEEKS),
                getProfile(Platform.CODEFORCES),
                getProfile(Platform.CODECHEF),
                getProfile(Platform.HACKERRANK)
        );
    }

    public CodingProfile getProfile(Platform platform) {
        if (platform == Platform.CODEFORCES) {
            try {
                return codeforcesService.getProfile();
            } catch (Exception e) {
               System.err.println("CODEFORCES FETCH FAILED");
               e.printStackTrace();
               return profileCache.get(Platform.CODEFORCES);
            }
        }
        if (platform == Platform.LEETCODE) {
            try {
                return leetCodeService.getProfile();
            } catch (Exception e) {
                System.err.println("LEETCODE FETCH FAILED");
                e.printStackTrace();
                return profileCache.get(Platform.LEETCODE);
            }
        }
        return profileCache.get(platform);
    }

    public void updateProfile(Platform platform, CodingProfile profile) {
        if (platform != null && profile != null) {
            profileCache.put(platform, profile);
        }
    }

    public CodingProfile updateProfileMetrics(Platform platform, Integer problemsSolved, String rating, Integer streak, String badge, String globalRank) {
        CodingProfile profile = profileCache.get(platform);
        if (profile != null) {
            if (problemsSolved != null) profile.setProblemsSolved(problemsSolved);
            if (rating != null) profile.setRating(rating);
            if (streak != null) profile.setStreak(streak);
            if (badge != null) profile.setBadge(badge);
            if (globalRank != null) profile.setGlobalRank(globalRank);
        }
        return profile;
    }
}
