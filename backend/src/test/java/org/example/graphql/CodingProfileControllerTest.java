package org.example.graphql;

import org.example.model.CodingProfile;
import org.example.model.Platform;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.GraphQlTest;
import org.springframework.context.annotation.Import;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.example.service.CodeforcesService;
import org.example.service.CodingProfileService;
import org.example.controller.CodingProfileController;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@GraphQlTest(CodingProfileController.class)
@Import({CodingProfileService.class, CodeforcesService.class})
public class CodingProfileControllerTest {

    @Autowired
    private GraphQlTester graphQlTester;

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
        assertEquals("cs1m2414238", profile.getUsername());
        assertEquals("1,847", profile.getRating());
        assertEquals(387, profile.getProblemsSolved());
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
