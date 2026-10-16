package org.example.controller;

import org.example.dto.UpdateCodingProfileInput;
import org.example.model.CodingProfile;
import org.example.model.Platform;
import org.example.service.CodingProfileService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class CodingProfileController {

    private final CodingProfileService service;

    public CodingProfileController(CodingProfileService service) {
        this.service = service;
    }

    @QueryMapping
    public List<CodingProfile> codingProfiles() {
        return service.getAllProfiles();
    }

    @QueryMapping
    public CodingProfile codingProfile(@Argument Platform platform) {
        return service.getProfile(platform);
    }

    @MutationMapping
    public CodingProfile updateCodingProfile(@Argument UpdateCodingProfileInput input) {
        return service.updateProfileMetrics(
                input.platform(),
                input.problemsSolved(),
                input.rating(),
                input.streak(),
                input.badge(),
                input.globalRank()
        );
    }
}
