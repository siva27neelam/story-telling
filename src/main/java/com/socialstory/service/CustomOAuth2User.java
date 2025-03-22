package com.socialstory.service;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

public class CustomOAuth2User implements org.springframework.security.oauth2.core.user.OAuth2User {
    private OAuth2User oauth2User;

    public CustomOAuth2User(OAuth2User oauth2User) {
        this.oauth2User = oauth2User;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return oauth2User.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return oauth2User.getAuthorities();
    }

    @Override
    public String getName() {
        return oauth2User.getAttribute("name"); // Gets the name attribute from Google
    }

    public String getEmail() {
        return oauth2User.getAttribute("email");
    }

    public String getGivenName() {
        return oauth2User.getAttribute("given_name"); // Gets the first name
    }

    public String getFamilyName() {
        return oauth2User.getAttribute("family_name"); // Gets the last name
    }
}