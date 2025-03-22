package com.socialstory.repository;

import com.socialstory.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserId(Long userId);

    @Query("SELECT us FROM UserSession us WHERE us.loginTime >= ?1")
    List<UserSession> findSessionsSince(LocalDateTime since);

    @Query("SELECT AVG(us.sessionDuration) FROM UserSession us WHERE us.user.id = ?1")
    Double getAverageSessionDurationForUser(Long userId);

    @Query("SELECT COUNT(us) FROM UserSession us WHERE DATE(us.loginTime) = CURRENT_DATE")
    Long countTodaySessions();

    @Query("SELECT COUNT(DISTINCT us.user.id) FROM UserSession us WHERE us.loginTime >= ?1 AND us.loginTime <= ?2")
    Long countSessionsBetween(LocalDateTime start, LocalDateTime end);
}