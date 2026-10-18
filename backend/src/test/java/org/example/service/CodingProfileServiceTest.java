package org.example.service;

import org.example.model.CodingProfile;
import org.example.model.Platform;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.*;

class CodingProfileServiceTest {

    @Test
    void keepsLastSuccessfulCountDuringFailureAndFetchesAgainOnRecovery() {
        LeetCodeService leetCode = mock(LeetCodeService.class);
        CodingProfileService service = new CodingProfileService(mock(CodeforcesService.class), leetCode,
                mock(CodeChefService.class), mock(HackerRankService.class), mock(GeeksforGeeksService.class));
        when(leetCode.getProfile())
                .thenReturn(CodingProfile.builder().username("9sY5neJGk8").problemsSolved(356).build())
                .thenThrow(new IllegalStateException("Upstream unavailable"))
                .thenReturn(CodingProfile.builder().username("9sY5neJGk8").problemsSolved(357).build());

        assertEquals(356, service.getProfile(Platform.LEETCODE).getProblemsSolved());
        assertEquals(356, service.getProfile(Platform.LEETCODE).getProblemsSolved());
        assertEquals(357, service.getProfile(Platform.LEETCODE).getProblemsSolved());
        verify(leetCode, times(3)).getProfile();
    }

    @Test
    void usesInitialSnapshotIfNoLiveRequestHasSucceeded() {
        LeetCodeService leetCode = mock(LeetCodeService.class);
        CodingProfileService service = new CodingProfileService(mock(CodeforcesService.class), leetCode,
                mock(CodeChefService.class), mock(HackerRankService.class), mock(GeeksforGeeksService.class));
        when(leetCode.getProfile()).thenThrow(new IllegalStateException("Upstream unavailable"));

        assertEquals(354, service.getProfile(Platform.LEETCODE).getProblemsSolved());
    }

    @Test
    void codeChefAndHackerRankKeepLastSuccessfulProfilesDuringFailure() {
        CodeChefService codeChef = mock(CodeChefService.class);
        HackerRankService hackerRank = mock(HackerRankService.class);
        CodingProfileService service = new CodingProfileService(mock(CodeforcesService.class), mock(LeetCodeService.class), codeChef, hackerRank, mock(GeeksforGeeksService.class));
        when(codeChef.getProfile()).thenReturn(CodingProfile.builder().problemsSolved(78).build())
                .thenThrow(new IllegalStateException("Upstream unavailable"));
        when(hackerRank.getProfile()).thenReturn(CodingProfile.builder().problemsSolved(82).build())
                .thenThrow(new IllegalStateException("Incomplete history"));
        assertEquals(78, service.getProfile(Platform.CODECHEF).getProblemsSolved());
        assertEquals(78, service.getProfile(Platform.CODECHEF).getProblemsSolved());
        assertEquals(82, service.getProfile(Platform.HACKERRANK).getProblemsSolved());
        assertEquals(82, service.getProfile(Platform.HACKERRANK).getProblemsSolved());
    }

    @Test
    void fallbackLinksPointAtTheProvidedAccounts() {
        CodeChefService codeChef = mock(CodeChefService.class);
        HackerRankService hackerRank = mock(HackerRankService.class);
        when(codeChef.getProfile()).thenThrow(new IllegalStateException("Offline"));
        when(hackerRank.getProfile()).thenThrow(new IllegalStateException("Offline"));
        CodingProfileService service = new CodingProfileService(mock(CodeforcesService.class), mock(LeetCodeService.class), codeChef, hackerRank, mock(GeeksforGeeksService.class));
        assertEquals(CodeChefService.PROFILE_URL, service.getProfile(Platform.CODECHEF).getProfileUrl());
        assertEquals(HackerRankService.PROFILE_URL, service.getProfile(Platform.HACKERRANK).getProfileUrl());
    }

    @Test
    void gfgKeepsLastSuccessfulDataOnFailureAndUsesTheCorrectAccount() {
        GeeksforGeeksService gfg = mock(GeeksforGeeksService.class);
        CodingProfileService service = new CodingProfileService(mock(CodeforcesService.class), mock(LeetCodeService.class),
                mock(CodeChefService.class), mock(HackerRankService.class), gfg);
        when(gfg.getProfile()).thenThrow(new IllegalStateException("Offline"))
                .thenReturn(CodingProfile.builder().username(GeeksforGeeksService.USERNAME).problemsSolved(12).build())
                .thenThrow(new IllegalStateException("Incomplete data"));
        CodingProfile initial = service.getProfile(Platform.GEEKSFORGEEKS);
        assertEquals(GeeksforGeeksService.USERNAME, initial.getUsername());
        assertEquals(GeeksforGeeksService.PROFILE_URL, initial.getProfileUrl());
        assertNull(initial.getProblemsSolved());
        assertEquals(12, service.getProfile(Platform.GEEKSFORGEEKS).getProblemsSolved());
        assertEquals(12, service.getProfile(Platform.GEEKSFORGEEKS).getProblemsSolved());
    }
}
