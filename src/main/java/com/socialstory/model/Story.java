package com.socialstory.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stories", indexes = {
        @Index(name = "idx_story_created_at", columnList = "createdAt")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Story {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String title;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Column(columnDefinition = "TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String tags;

    @Lob
    @Column(name = "cover_image", columnDefinition = "LONGBLOB")
    @Basic(fetch = FetchType.LAZY)
    private byte[] coverImage;

    @Column(name = "cover_image_type")
    private String coverImageType;

    // Update the pages relationship with cascade delete
    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("pageOrder")
    @JsonManagedReference
    private List<StoryPage> pages = new ArrayList<>();

    // Add cascade delete for user interactions
    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserStoryInteraction> userInteractions = new ArrayList<>();

    @Column(name = "is_cover_compressed")
    private Boolean isCoverCompressed = false;

    @Enumerated(EnumType.STRING)
    private StoryStatus status = StoryStatus.DRAFT;

    private String changedBy; // User who last changed the story
    private LocalDateTime submittedForApprovalAt;
    private String approvedBy;
    private LocalDateTime approvedAt;

    @Column(name = "cover_image_path")
    private String coverImagePath;

    // Flag for migration status
    @Column(name = "image_migrated")
    private boolean imageMigrated = false;

    public enum StoryStatus {
        DRAFT,        // Created but not submitted
        PENDING,      // Submitted for approval
        PUBLISHED,    // Approved and visible
        ARCHIVED      // Rejected or removed
    }
}