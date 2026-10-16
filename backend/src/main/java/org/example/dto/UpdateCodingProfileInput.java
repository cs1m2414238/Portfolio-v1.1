package org.example.dto;

import org.example.model.Platform;

public record UpdateCodingProfileInput(
        Platform platform,
        Integer problemsSolved,
        String rating,
        Integer streak,
        String badge,
        String globalRank
) {
}
