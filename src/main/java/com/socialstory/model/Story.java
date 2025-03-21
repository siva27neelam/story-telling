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
@Table(name = "stories")
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
    private byte[] coverImage;

    @Column(name = "cover_image_type")
    private String coverImageType;

    // Update the pages relationship
    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("pageOrder")
    @JsonManagedReference
    private List<StoryPage> pages = new ArrayList<>();
}