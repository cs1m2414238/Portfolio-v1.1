package org.example.service;

import org.example.exception.RateLimitExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS = 2;

    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private record DailyCount(LocalDate date, int count) {}

    private final ConcurrentHashMap<String, DailyCount> requests =
            new ConcurrentHashMap<>();

    public void checkAndRecord(String clientIP) {
        LocalDate today = LocalDate.now(ZONE);

        requests.compute(clientIP, (ip, previous) -> {
            if(previous == null|| !previous.date().equals(today) ){
                return new DailyCount(today, 1);
            }
            if(previous.count() >= MAX_REQUESTS){
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Daily limit reached"
                );
            }
            return
                    new DailyCount(today,previous.count+1);
        });
    }

    // Refund an attempt if a downstream operation fails
    public void refund(String clientIp){
        LocalDate today  = LocalDate.now(ZONE);

        requests.computeIfPresent(clientIp, (ip, previous) -> {

            if (!previous.date().equals(today)) {
                return previous;
            }

            return new DailyCount(
                    today,
                    Math.max(0, previous.count() - 1)
            );
        });
    }
}
