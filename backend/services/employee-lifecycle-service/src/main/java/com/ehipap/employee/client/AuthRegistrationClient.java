package com.ehipap.employee.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Component
public class AuthRegistrationClient {

    private static final Logger log = LoggerFactory.getLogger(AuthRegistrationClient.class);

    private final RestTemplate restTemplate;
    private final String authServiceUrl;

    public AuthRegistrationClient(RestTemplate restTemplate,
                                  @Value("${auth.service.url:http://localhost:8081}") String authServiceUrl) {
        this.restTemplate = restTemplate;
        this.authServiceUrl = authServiceUrl;
    }

    public UUID registerEmployeeUser(String username, String email, String password) {
        String url = authServiceUrl + "/api/v1/auth/register";
        Map<String, String> body = Map.of(
                "username", username,
                "email", email,
                "password", password,
                "role", "EMPLOYEE"
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            Map<?, ?> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Auth service returned empty response");
            }
            Object userObj = responseBody.get("user");
            if (!(userObj instanceof Map<?, ?> userMap)) {
                throw new RuntimeException("Auth service response missing user");
            }
            Object id = userMap.get("id");
            if (id == null) {
                throw new RuntimeException("Auth service response missing user id");
            }
            return UUID.fromString(id.toString());
        } catch (RestClientException ex) {
            log.error("Failed to register user for employee {}: {}", email, ex.getMessage());
            throw new RuntimeException("Failed to create login account: " + ex.getMessage());
        }
    }
}
