package org.example.service;

import org.example.model.CodingProfile;
import org.example.model.Metric;
import org.example.model.Platform;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CodeChefService {
    static final String USERNAME = "unexpected628";
    static final String PROFILE_URL = "https://www.codechef.com/users/" + USERNAME;
    private static final Pattern SOLVED = Pattern.compile("Total Problems Solved\\s*:\\s*([\\d,]+)", Pattern.CASE_INSENSITIVE);
    private final RestTemplate restTemplate;

    public CodeChefService(RestTemplateBuilder builder) {
        restTemplate = builder.connectTimeout(Duration.ofSeconds(2)).readTimeout(Duration.ofSeconds(4)).build();
    }

    public CodingProfile getProfile() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0");
        String html = restTemplate.exchange(PROFILE_URL, HttpMethod.GET, new HttpEntity<>(headers), String.class).getBody();
        if (html == null) throw new IllegalStateException("Empty CodeChef profile response");
        Document document = Jsoup.parse(html);
        Element details = document.selectFirst(".user-details-container");
        if (details == null || !details.text().contains(USERNAME)) {
            throw new IllegalStateException("CodeChef profile not found: " + USERNAME);
        }
        Matcher solved = SOLVED.matcher(details.text());
        if (!solved.find()) throw new IllegalStateException("CodeChef response is missing the solved count");
        int count = Integer.parseInt(solved.group(1).replace(",", ""));

        Element ratingElement = document.selectFirst(".rating-number");
        String rating = "Unrated";
        String division = "Unrated";
        if (ratingElement != null) {
            Matcher number = Pattern.compile("\\d+").matcher(ratingElement.ownText());
            if (!number.find()) throw new IllegalStateException("Invalid CodeChef rating");
            int value = Integer.parseInt(number.group());
            rating = Integer.toString(value);
            Matcher divisionText = Pattern.compile("\\bDiv\\s*(\\d+)", Pattern.CASE_INSENSITIVE)
                    .matcher(document.select(".rating-header").text());
            division = divisionText.find() ? "Div " + divisionText.group(1) : "-";
        }
        Element rank = document.selectFirst(".rating-ranks ul li:first-child strong");
        String globalRank = rank == null ? "-" : rank.text().trim();
        if (globalRank.isEmpty()) globalRank = "-";

        return CodingProfile.builder()
                .platform(Platform.CODECHEF).name("CodeChef").username(USERNAME).profileUrl(PROFILE_URL)
                .problemsSolved(count).rating(rating).badge(division).globalRank(globalRank).active(true)
                .metrics(List.of(
                        new Metric("Problems Solved", Integer.toString(count), "Total Solved"),
                        new Metric("Rating", rating, "Contest Rating"),
                        new Metric("Division", division, "Contest Division"),
                        new Metric("Global Rank", globalRank, "Contest Rank")
                )).build();
    }
}
