package org.example.service;

import org.example.model.CodingProfile;
import org.example.model.Metric;
import org.example.model.Platform;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

@Service
public class CodingProfileService {

    private static final Logger log = LoggerFactory.getLogger(CodingProfileService.class);

    private final Map<Platform, CodingProfile> profileCache = new ConcurrentHashMap<>();
    private final CodeforcesService codeforcesService;
    private final LeetCodeService leetCodeService;
    private final CodeChefService codeChefService;
    private final HackerRankService hackerRankService;
    private final GeeksforGeeksService geeksforGeeksService;

    public CodingProfileService(CodeforcesService codeforcesService, LeetCodeService leetCodeService,
                                CodeChefService codeChefService, HackerRankService hackerRankService,
                                GeeksforGeeksService geeksforGeeksService) {
        this.codeforcesService = codeforcesService;
        this.leetCodeService = leetCodeService;
        this.codeChefService = codeChefService;
        this.hackerRankService = hackerRankService;
        this.geeksforGeeksService = geeksforGeeksService;
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
                .rating("-")
                .globalRank("-")
                .badge(null)
                .streak(null)
                .active(true)
                .metrics(Arrays.asList(
                        new Metric("Problems Solved", "354", "Total Solved"),
                        new Metric("Contest Rating", "-", "Contest Rating"),
                        new Metric("Max Streak", "-", "Days")
                ))
                .build();

        // 2. GeeksforGeeks Profile
        CodingProfile gfg = CodingProfile.builder()
                .platform(Platform.GEEKSFORGEEKS)
                .name("GeeksforGeeks")
                .username(GeeksforGeeksService.USERNAME)
                .profileUrl(GeeksforGeeksService.PROFILE_URL)
                .problemsSolved(null)
                .rating("-")
                .globalRank("-")
                .badge("-")
                .streak(null)
                .active(false)
                .metrics(new ArrayList<>())
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
                .username(CodeChefService.USERNAME)
                .profileUrl(CodeChefService.PROFILE_URL)
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
                .username(HackerRankService.USERNAME)
                .profileUrl(HackerRankService.PROFILE_URL)
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
        // Independent upstream requests run together; returned cards keep their visual order.
        List<CompletableFuture<CodingProfile>> requests = Arrays.stream(Platform.values())
                .map(platform -> CompletableFuture.supplyAsync(() -> getProfile(platform)))
                .toList();
        return requests.stream().map(CompletableFuture::join).toList();
    }

    public CodingProfile getProfile(Platform platform) {
        Supplier<CodingProfile> fetch = switch (platform) {
            case LEETCODE -> leetCodeService::getProfile;
            case GEEKSFORGEEKS -> geeksforGeeksService::getProfile;
            case CODEFORCES -> codeforcesService::getProfile;
            case CODECHEF -> codeChefService::getProfile;
            case HACKERRANK -> hackerRankService::getProfile;
            default -> null;
        };
        if (fetch == null) return profileCache.get(platform);
        try {
            CodingProfile profile = fetch.get();
            if (profile == null) throw new IllegalStateException("Empty live profile");
            profileCache.put(platform, profile);
            log.info("Live {} profile: username={}, problemsSolved={}", platform, profile.getUsername(), profile.getProblemsSolved());
            return profile;
        } catch (Exception error) {
            CodingProfile cached = profileCache.get(platform);
            log.warn("Live {} fetch failed; keeping cached problemsSolved={}", platform, cached.getProblemsSolved(), error);
            return cached;
        }
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
