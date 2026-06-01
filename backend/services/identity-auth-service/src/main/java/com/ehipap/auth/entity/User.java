package com.ehipap.auth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "mfa_enabled")
    private boolean mfaEnabled = false;

    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Role {
        SUPER_ADMIN, HR_MANAGER, EMPLOYEE, RECRUITER, FINANCE_MANAGER
    }

    public User() {}

    public User(UUID id, String username, String email, String passwordHash, Role role,
                boolean active, boolean mfaEnabled, String mfaSecret,
                LocalDateTime lastLogin, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id; this.username = username; this.email = email;
        this.passwordHash = passwordHash; this.role = role; this.active = active;
        this.mfaEnabled = mfaEnabled; this.mfaSecret = mfaSecret;
        this.lastLogin = lastLogin; this.createdAt = createdAt; this.updatedAt = updatedAt;
    }

    public static UserBuilder builder() { return new UserBuilder(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }
    public String getMfaSecret() { return mfaSecret; }
    public void setMfaSecret(String mfaSecret) { this.mfaSecret = mfaSecret; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User user)) return false;
        return active == user.active
                && mfaEnabled == user.mfaEnabled
                && Objects.equals(id, user.id)
                && Objects.equals(username, user.username)
                && Objects.equals(email, user.email)
                && Objects.equals(passwordHash, user.passwordHash)
                && role == user.role
                && Objects.equals(mfaSecret, user.mfaSecret)
                && Objects.equals(lastLogin, user.lastLogin)
                && Objects.equals(createdAt, user.createdAt)
                && Objects.equals(updatedAt, user.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username, email, passwordHash, role, active, mfaEnabled,
                mfaSecret, lastLogin, createdAt, updatedAt);
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", active=" + active +
                ", mfaEnabled=" + mfaEnabled +
                ", lastLogin=" + lastLogin +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    public static class UserBuilder {
        private UUID id; private String username; private String email;
        private String passwordHash; private Role role; private boolean active = true;
        private boolean mfaEnabled = false; private String mfaSecret;
        private LocalDateTime lastLogin; private LocalDateTime createdAt; private LocalDateTime updatedAt;

        public UserBuilder id(UUID id) { this.id = id; return this; }
        public UserBuilder username(String username) { this.username = username; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder passwordHash(String passwordHash) { this.passwordHash = passwordHash; return this; }
        public UserBuilder role(Role role) { this.role = role; return this; }
        public UserBuilder active(boolean active) { this.active = active; return this; }
        public UserBuilder isActive(boolean active) { this.active = active; return this; }
        public UserBuilder mfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; return this; }
        public UserBuilder mfaSecret(String mfaSecret) { this.mfaSecret = mfaSecret; return this; }
        public UserBuilder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public User build() {
            User u = new User();
            u.id = id; u.username = username; u.email = email;
            u.passwordHash = passwordHash; u.role = role; u.active = active;
            u.mfaEnabled = mfaEnabled; u.mfaSecret = mfaSecret; u.lastLogin = lastLogin;
            u.createdAt = createdAt; u.updatedAt = updatedAt;
            return u;
        }
    }
}
