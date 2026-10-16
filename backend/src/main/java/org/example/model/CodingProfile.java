package org.example.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingProfile {
    private Platform platform;
    private String name;
    private String username;
    private String profileUrl;
    private String avatarUrl;
    private Integer problemsSolved;
    private String rating;
    private String globalRank;
    private String badge;
    private Integer streak;
    private List<Metric> metrics;
    private Boolean active;
}
