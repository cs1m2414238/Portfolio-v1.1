package org.example.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GithubService {

    private final String userName;
    private final RestClient githubClient;

    public GithubService(
            RestClient.Builder builder,
            @Value("${github.username:cs1m2414238}") String userName,
            @Value("${github.token:}") String token) {

        this.userName = userName;
        RestClient.Builder clientBuilder = builder
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json");

        if (token != null && !token.isBlank()) {
            clientBuilder.defaultHeader("Authorization", "Bearer " + token.trim());
        }

        this.githubClient = clientBuilder.build();
    }
    public JsonNode getProfile(){
        return githubClient.get()
                .uri("/users/{username}", userName)
                .retrieve()
                .body(JsonNode.class);

    }

    public JsonNode getRepositories() {
        return githubClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users/{username}/repos")
                        .queryParam("sort", "pushed")
                        .queryParam("direction", "desc")
                        .queryParam("per_page", 30)
                        .build(userName))
                .retrieve()
                .body(JsonNode.class);
    }
}