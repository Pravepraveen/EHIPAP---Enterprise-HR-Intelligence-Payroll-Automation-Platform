package com.ehipap.auth.service;

import com.ehipap.auth.dto.AuthResponse;
import com.ehipap.auth.dto.LoginRequest;
import com.ehipap.auth.dto.RegisterRequest;
import com.ehipap.auth.entity.RefreshToken;
import com.ehipap.auth.entity.User;
import com.ehipap.auth.repository.RefreshTokenRepository;
import com.ehipap.auth.repository.UserRepository;
import com.ehipap.auth.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isActive()) throw new RuntimeException("Account is disabled");

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
            throw new RuntimeException("Invalid credentials");

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenRepository.deleteByUser(user);
        RefreshToken rt = RefreshToken.builder()
                .user(user).token(refreshToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(rt);

        log.info("User {} logged in successfully", user.getUsername());
        return buildResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new RuntimeException("Username already exists");
        if (userRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email already exists");

        User.Role role;
        try { role = User.Role.valueOf(request.getRole().toUpperCase()); }
        catch (Exception e) { role = User.Role.EMPLOYEE; }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        RefreshToken rt = RefreshToken.builder()
                .user(user).token(refreshToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(rt);

        return buildResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        RefreshToken rt = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (rt.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(rt);
            throw new RuntimeException("Refresh token expired");
        }

        User user = rt.getUser();
        String newAccess = jwtService.generateAccessToken(user);
        String newRefresh = jwtService.generateRefreshToken(user);

        rt.setToken(newRefresh);
        rt.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(rt);

        return buildResponse(user, newAccess, newRefresh);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildResponse(User user, String access, String refresh) {
        return AuthResponse.builder()
                .accessToken(access)
                .refreshToken(refresh)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId().toString())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .build();
    }
}
