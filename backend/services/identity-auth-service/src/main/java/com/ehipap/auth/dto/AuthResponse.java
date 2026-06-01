package com.ehipap.auth.dto;

public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserInfo user;

    public AuthResponse() {}

    public static Builder builder() { return new Builder(); }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public static class UserInfo {
        private String id;
        private String username;
        private String email;
        private String role;

        public UserInfo() {}
        public static UserInfoBuilder builder() { return new UserInfoBuilder(); }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public static class UserInfoBuilder {
            private String id, username, email, role;
            public UserInfoBuilder id(String id) { this.id = id; return this; }
            public UserInfoBuilder username(String u) { this.username = u; return this; }
            public UserInfoBuilder email(String e) { this.email = e; return this; }
            public UserInfoBuilder role(String r) { this.role = r; return this; }
            public UserInfo build() {
                UserInfo ui = new UserInfo();
                ui.id = id; ui.username = username; ui.email = email; ui.role = role;
                return ui;
            }
        }
    }

    public static class Builder {
        private String accessToken, refreshToken, tokenType = "Bearer";
        private long expiresIn;
        private UserInfo user;
        public Builder accessToken(String t) { this.accessToken = t; return this; }
        public Builder refreshToken(String t) { this.refreshToken = t; return this; }
        public Builder tokenType(String t) { this.tokenType = t; return this; }
        public Builder expiresIn(long e) { this.expiresIn = e; return this; }
        public Builder user(UserInfo u) { this.user = u; return this; }
        public AuthResponse build() {
            AuthResponse r = new AuthResponse();
            r.accessToken = accessToken; r.refreshToken = refreshToken;
            r.tokenType = tokenType; r.expiresIn = expiresIn; r.user = user;
            return r;
        }
    }
}
