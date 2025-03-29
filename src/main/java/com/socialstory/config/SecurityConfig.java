package com.socialstory.config;

import com.socialstory.model.User;
import com.socialstory.model.UserSession;
import com.socialstory.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutHandler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserService userService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authorizeRequests ->
                        authorizeRequests
                                .requestMatchers("/", "/stories", "/stories/view/**", "/css/**", "/js/**", "/stories/image/**", "/stories/cover/**").permitAll()
                                .requestMatchers("/admin/**").authenticated()
                                .requestMatchers("/stories/create", "/stories/edit/**", "/stories/delete/**").authenticated()
                                .anyRequest().permitAll()
                )
                .oauth2Login(oauth2 ->
                        oauth2
                                .loginPage("/login")
                                .successHandler(authenticationSuccessHandler())
                )
                .logout(logout ->
                        logout
                                .logoutSuccessUrl("/stories")
                                .addLogoutHandler(logoutHandler())
                                .permitAll()
                )
                .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }

    private AuthenticationSuccessHandler authenticationSuccessHandler() {
        return new AuthenticationSuccessHandler() {
            @Override
            public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                                Authentication authentication) throws IOException, ServletException {
                if (authentication instanceof OAuth2AuthenticationToken oauth2Auth) {
                    User user = userService.processOAuthUser(oauth2Auth);

                    // Store user and session info in the HTTP session for quick access
                    HttpSession session = request.getSession();

                    UserSession userSession = userService.startUserSession(user, session);
                    session.setAttribute("currentUser", user);
                    session.setAttribute("currentSession", userSession);
                }

                response.sendRedirect("/stories");
            }
        };
    }

    private LogoutHandler logoutHandler() {
        return new LogoutHandler() {
            @Override
            public void logout(HttpServletRequest request, HttpServletResponse response,
                               Authentication authentication) {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    UserSession userSession = (UserSession) session.getAttribute("currentSession");
                    if (userSession != null) {
                        userService.endUserSession(userSession);
                    }
                    session.removeAttribute("currentUser");
                    session.removeAttribute("currentSession");
                }
            }
        };
    }
}