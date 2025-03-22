package com.socialstory.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_story_interactions")
@EntityListeners(AuditingEntityListener.class)
@Data
public class UserStoryInteraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id")
    private Story story;

    @CreatedDate
    private LocalDateTime firstReadAt;

    @LastModifiedDate
    private LocalDateTime lastReadAt;

    private int readCount;

    private boolean completed;

    private int lastPageRead;

    private Integer questionsAnswered;

    private Integer questionsCorrect;

    // Tracks time spent in seconds
    private Long timeSpent;

    // For tracking favorite stories
    private boolean favorite;
}