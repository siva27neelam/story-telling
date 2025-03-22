package com.socialstory.service;

import com.socialstory.model.User;
import com.socialstory.model.UserSession;
import com.socialstory.model.UserStoryInteraction;
import com.socialstory.repository.StoryRepository;
import com.socialstory.repository.UserRepository;
import com.socialstory.repository.UserSessionRepository;
import com.socialstory.repository.UserStoryInteractionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final UserStoryInteractionRepository userStoryInteractionRepository;
    private final StoryRepository storyRepository;
    private final HttpServletRequest request;

    @Transactional
    public User processOAuthUser(OAuth2AuthenticationToken authentication) {
        Map<String, Object> attributes;
        String email;
        String sub;
        String firstName = null;
        String lastName = null;
        String pictureUrl = null;

        // Add logging
        log.info("Authentication provider: {}", authentication.getAuthorizedClientRegistrationId());
        log.info("Principal class: {}", authentication.getPrincipal().getClass().getName());
        log.info("Attributes: {}", authentication.getPrincipal().getAttributes());

        if (authentication.getPrincipal() instanceof OidcUser) {
            // OIDC authentication (like Google with openid scope)
            OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
            attributes = oidcUser.getAttributes();
            email = oidcUser.getEmail();
            sub = oidcUser.getSubject();
            firstName = oidcUser.getGivenName();
            lastName = oidcUser.getFamilyName();
            pictureUrl = oidcUser.getPicture();
            log.info("Processed as OidcUser: email={}, name={} {}", email, firstName, lastName);
        } else {
            // OAuth2 authentication (standard OAuth2 without openid scope)
            OAuth2User oauth2User = authentication.getPrincipal();
            attributes = oauth2User.getAttributes();
            email = (String) attributes.get("email");
            sub = (String) attributes.get("sub");

            // Try to extract other info based on provider
            if (authentication.getAuthorizedClientRegistrationId().equals("google")) {
                firstName = (String) attributes.get("given_name");
                lastName = (String) attributes.get("family_name");
                pictureUrl = (String) attributes.get("picture");
            }
            log.info("Processed as OAuth2User: email={}, name={} {}", email, firstName, lastName);
        }

        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setLastLoggedInAt(LocalDateTime.now());
            user.setTotalVisits(user.getTotalVisits() + 1);
            log.info("Updated existing user: id={}", user.getId());
        } else {
            user = new User();
            user.setEmail(email);
            user.setOauthId(sub);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPictureUrl(pictureUrl);
            user.setTotalVisits(1);
            log.info("Created new user");
        }

        user = userRepository.save(user);
        log.info("Saved user with id={}", user.getId());
        return user;
    }
    @Transactional
    public UserSession startUserSession(User user) {
        UserSession session = new UserSession();
        session.setUser(user);
        session.setLoginTime(LocalDateTime.now());
        session.setIpAddress(request.getRemoteAddr());
        session.setUserAgent(request.getHeader("User-Agent"));

        // Detect device type from user agent
        String userAgent = request.getHeader("User-Agent").toLowerCase();
        if (userAgent.contains("mobile") || userAgent.contains("android") || userAgent.contains("iphone")) {
            session.setDeviceType("MOBILE");
        } else if (userAgent.contains("tablet") || userAgent.contains("ipad")) {
            session.setDeviceType("TABLET");
        } else {
            session.setDeviceType("DESKTOP");
        }

        return userSessionRepository.save(session);
    }

    @Transactional
    public void endUserSession(UserSession session) {
        session.setLogoutTime(LocalDateTime.now());
        session.setSessionDuration(
                java.time.Duration.between(session.getLoginTime(), session.getLogoutTime()).getSeconds()
        );
        userSessionRepository.save(session);
    }

    @Transactional
    public UserStoryInteraction recordStoryInteraction(User user, Long storyId, int pageNumber, boolean completed) {
        Optional<UserStoryInteraction> existingInteraction =
                userStoryInteractionRepository.findByUserIdAndStoryId(user.getId(), storyId);

        if (existingInteraction.isPresent()) {
            UserStoryInteraction interaction = existingInteraction.get();
            interaction.setLastReadAt(LocalDateTime.now());
            interaction.setReadCount(interaction.getReadCount() + 1);
            interaction.setLastPageRead(Math.max(interaction.getLastPageRead(), pageNumber));

            if (completed) {
                interaction.setCompleted(true);
            }

            return userStoryInteractionRepository.save(interaction);
        } else {
            UserStoryInteraction newInteraction = new UserStoryInteraction();
            newInteraction.setUser(user);
            newInteraction.setStory(storyRepository.findById(storyId).orElseThrow());
            newInteraction.setReadCount(1);
            newInteraction.setLastPageRead(pageNumber);
            newInteraction.setCompleted(completed);
            return userStoryInteractionRepository.save(newInteraction);
        }
    }

    @Transactional
    public void updateTimeSpent(Long interactionId, Long additionalSeconds) {
        UserStoryInteraction interaction = userStoryInteractionRepository.findById(interactionId)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));

        Long currentTime = interaction.getTimeSpent() != null ? interaction.getTimeSpent() : 0L;
        interaction.setTimeSpent(currentTime + additionalSeconds);
        userStoryInteractionRepository.save(interaction);
    }

    @Transactional
    public void recordQuestionAnswered(Long interactionId, boolean correct) {
        UserStoryInteraction interaction = userStoryInteractionRepository.findById(interactionId)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));

        Integer currentAnswered = interaction.getQuestionsAnswered() != null ?
                interaction.getQuestionsAnswered() : 0;
        Integer currentCorrect = interaction.getQuestionsCorrect() != null ?
                interaction.getQuestionsCorrect() : 0;

        interaction.setQuestionsAnswered(currentAnswered + 1);

        if (correct) {
            interaction.setQuestionsCorrect(currentCorrect + 1);
        }

        userStoryInteractionRepository.save(interaction);
    }

    @Transactional
    public void markStoryComplete(Long interactionId) {
        UserStoryInteraction interaction = userStoryInteractionRepository.findById(interactionId)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));

        interaction.setCompleted(true);
        userStoryInteractionRepository.save(interaction);
    }

    @Transactional
    public boolean toggleFavorite(Long interactionId) {
        UserStoryInteraction interaction = userStoryInteractionRepository.findById(interactionId)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));

        interaction.setFavorite(!interaction.isFavorite());
        userStoryInteractionRepository.save(interaction);

        return interaction.isFavorite();
    }

    public Set<Long> getUnreadStoryIds(Long userId) {
        List<UserStoryInteraction> interactions = userStoryInteractionRepository.findByUserId(userId);
        Set<Long> readStoryIds = interactions.stream()
                .map(interaction -> interaction.getStory().getId())
                .collect(Collectors.toSet());

        List<com.socialstory.model.Story> allStories = storyRepository.findAll();

        Set<Long> allStoryIds = allStories.stream()
                .map(com.socialstory.model.Story::getId)
                .collect(Collectors.toSet());

        // Remove read stories from all stories
        allStoryIds.removeAll(readStoryIds);

        return allStoryIds;
    }

    public Long getStoryReadCount(Long storyId) {
        return userStoryInteractionRepository.countUniqueReadersForStory(storyId);
    }

    public Long getActiveUsersForDate(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay().minusNanos(1);

        return userSessionRepository.countSessionsBetween(startOfDay, endOfDay);
    }

    public Map<String, Object> getMetricsForAdminDashboard() {
        Map<String, Object> metrics = new HashMap<>();

        // Total users
        metrics.put("totalUsers", userRepository.count());

        // Active users today
        metrics.put("activeTodayUsers", userSessionRepository.countTodaySessions());

        // Top 5 most read stories
        List<Long> topStoryIds = userStoryInteractionRepository.findMostReadStories();
        metrics.put("topStories", topStoryIds.stream().limit(5).collect(Collectors.toList()));

        // Top 5 most favorited stories
        metrics.put("topFavorites", userStoryInteractionRepository.findMostFavoritedStories().stream().limit(5).collect(Collectors.toList()));

        // Average session duration
        Double avgSessionDuration = userSessionRepository.getAverageSessionDurationForUser(null);
        metrics.put("avgSessionDuration", avgSessionDuration != null ? avgSessionDuration : 0.0);

        return metrics;
    }

    public List<Map<String, Object>> getRecentActivities(int limit) {
        List<UserStoryInteraction> recentInteractions =
                userStoryInteractionRepository.findRecentInteractions(limit);

        return recentInteractions.stream().map(interaction -> {
            Map<String, Object> activity = new HashMap<>();
            activity.put("userName", interaction.getUser().getFirstName() + " " + interaction.getUser().getLastName());
            activity.put("storyTitle", interaction.getStory().getTitle());
            activity.put("activityType", interaction.isCompleted() ? "Completed" : "Read");
            activity.put("timestamp", interaction.getLastReadAt());
            return activity;
        }).collect(Collectors.toList());
    }
}