package org.example.graphql;

import org.example.model.CodingProfile;
import org.example.model.Platform;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.GraphQlTest;
import org.springframework.context.annotation.Import;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.example.service.CodeforcesService;
import org.example.service.CodingProfileService;
import org.example.service.LeetCodeService;
import org.example.service.CodeChefService;
import org.example.service.HackerRankService;
import org.example.service.GeeksforGeeksService;
import org.example.controller.CodingProfileController;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@GraphQlTest(CodingProfileController.class)
@Import(CodingProfileService.class)
public class CodingProfileControllerTest {

    @Autowired
    private GraphQlTester graphQlTester;

    @MockitoBean
    private LeetCodeService leetCodeService;

    @MockitoBean
    private CodeforcesService codeforcesService;

    @MockitoBean
    private CodeChefService codeChefService;

    @MockitoBean
    private HackerRankService hackerRankService;

    @MockitoBean
    private GeeksforGeeksService geeksforGeeksService;

    @BeforeEach
    void setUpLiveProfiles() {
        when(geeksforGeeksService.getProfile()).thenReturn(CodingProfile.builder()
                .platform(Platform.GEEKSFORGEEKS).name("GeeksforGeeks").username("2k24cs1mvgrc")
                .profileUrl("https://www.geeksforgeeks.org/profile/2k24cs1mvgrc")
                .problemsSolved(12).rating("38").streak(0).metrics(List.of()).active(true).build());
        when(leetCodeService.getProfile()).thenReturn(CodingProfile.builder()
                .platform(Platform.LEETCODE)
                .name("LeetCode")
                .username("9sY5neJGk8")
                .profileUrl("https://leetcode.com/u/9sY5neJGk8/")
                .problemsSolved(356)
                .rating("1,481")
                .metrics(List.of())
                .active(true)
                .build());
        when(codeChefService.getProfile()).thenReturn(CodingProfile.builder()
                .platform(Platform.CODECHEF).name("CodeChef").username("unexpected628")
                .profileUrl("https://www.codechef.com/users/unexpected628")
                .problemsSolved(78).rating("Unrated").badge("Unrated").metrics(List.of()).active(true).build());
        when(hackerRankService.getProfile()).thenReturn(CodingProfile.builder()
                .platform(Platform.HACKERRANK).name("HackerRank").username("cs1m_2414238")
                .profileUrl("https://www.hackerrank.com/profile/cs1m_2414238")
                .problemsSolved(82).rating("4\u2605").badge("6").metrics(List.of()).active(true).build());
        when(codeforcesService.getProfile()).thenReturn(CodingProfile.builder()
                .platform(Platform.CODEFORCES)
                .name("Codeforces")
                .username("Unexpectedpriyanshu")
                .profileUrl("https://codeforces.com/profile/Unexpectedpriyanshu")
                .rating("562")
                .badge("newbie")
                .metrics(List.of())
                .active(true)
                .build());
    }

    @Test
    void testQueryAllCodingProfiles() {
        String document = """
            query {
                codingProfiles {
                    platform
                    name
                    username
                    profileUrl
                    problemsSolved
                    rating
                    streak
                    active
                }
            }
        """;

        List<CodingProfile> profiles = graphQlTester.document(document)
                .execute()
                .path("codingProfiles")
                .entityList(CodingProfile.class)
                .get();

        assertNotNull(profiles);
        assertFalse(profiles.isEmpty());
        assertEquals(5, profiles.size());
        assertEquals(356, profiles.get(0).getProblemsSolved());
        assertEquals("2k24cs1mvgrc", profiles.get(1).getUsername());
        assertEquals(12, profiles.get(1).getProblemsSolved());
        assertEquals("38", profiles.get(1).getRating());
        assertEquals(0, profiles.get(1).getStreak());
        assertEquals(Platform.CODECHEF, profiles.get(3).getPlatform());
        assertEquals("unexpected628", profiles.get(3).getUsername());
        assertEquals(78, profiles.get(3).getProblemsSolved());
        assertEquals(Platform.HACKERRANK, profiles.get(4).getPlatform());
        assertEquals("cs1m_2414238", profiles.get(4).getUsername());
        assertEquals(82, profiles.get(4).getProblemsSolved());
    }

    @Test
    void testQuerySingleCodingProfile() {
        String document = """
            query {
                codingProfile(platform: LEETCODE) {
                    platform
                    name
                    username
                    rating
                    badge
                    problemsSolved
                    active
                }
            }
        """;

        CodingProfile profile = graphQlTester.document(document)
                .execute()
                .path("codingProfile")
                .entity(CodingProfile.class)
                .get();

        assertNotNull(profile);
        assertEquals(Platform.LEETCODE, profile.getPlatform());
        assertEquals("9sY5neJGk8", profile.getUsername());
        assertEquals("1,481", profile.getRating());
        assertEquals(356, profile.getProblemsSolved());
    }

    @Test
    void testQueryCodeforcesProfile() {
        String document = """
            query {
                codingProfile(platform: CODEFORCES) {
                    platform
                    name
                    username
                    rating
                    badge
                    globalRank
                    active
                }
            }
        """;

        CodingProfile profile = graphQlTester.document(document)
                .execute()
                .path("codingProfile")
                .entity(CodingProfile.class)
                .get();

        assertNotNull(profile);
        assertEquals(Platform.CODEFORCES, profile.getPlatform());
        assertEquals("Unexpectedpriyanshu", profile.getUsername());
        assertNotNull(profile.getRating());
        assertNotNull(profile.getBadge());
    }
}
