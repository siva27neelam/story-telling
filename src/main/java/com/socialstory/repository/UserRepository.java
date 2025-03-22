package com.socialstory.repository;

import com.socialstory.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByOauthId(String oauthId);

    @Query("SELECT u FROM User u ORDER BY u.totalVisits DESC")
    List<User> findTopUsersByVisits();

    @Query("SELECT u FROM User u WHERE u.lastLoggedInAt > ?1")
    List<User> findRecentlyActiveUsers(LocalDateTime since);
}