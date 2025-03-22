package com.socialstory.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
@EntityListeners(AuditingEntityListener.class)
@Data
public class UserSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @CreatedDate
    private LocalDateTime loginTime;

    private LocalDateTime logoutTime;

    private String ipAddress;

    private String userAgent;

    private String deviceType;

    // For tracking the session duration in seconds
    private Long sessionDuration;
}