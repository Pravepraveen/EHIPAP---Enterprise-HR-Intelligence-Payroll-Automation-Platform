package com.ehipap.auth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public RefreshToken() {}

    public RefreshToken(UUID id, User user, String token, LocalDateTime expiresAt, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.token = token;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public static Builder builder() { return new Builder(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RefreshToken that)) return false;
        return Objects.equals(id, that.id)
                && Objects.equals(user, that.user)
                && Objects.equals(token, that.token)
                && Objects.equals(expiresAt, that.expiresAt)
                && Objects.equals(createdAt, that.createdAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, user, token, expiresAt, createdAt);
    }

    @Override
    public String toString() {
        return "RefreshToken{" +
                "id=" + id +
                ", userId=" + (user != null ? user.getId() : null) +
                ", expiresAt=" + expiresAt +
                ", createdAt=" + createdAt +
                '}';
    }

    public static class Builder {
        private UUID id;
        private User user;
        private String token;
        private LocalDateTime expiresAt;
        private LocalDateTime createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder token(String token) { this.token = token; return this; }
        public Builder expiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public RefreshToken build() {
            RefreshToken rt = new RefreshToken();
            rt.id = id;
            rt.user = user;
            rt.token = token;
            rt.expiresAt = expiresAt;
            rt.createdAt = createdAt;
            return rt;
        }
    }
}
