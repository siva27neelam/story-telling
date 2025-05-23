package com.socialstory.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "story_pages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoryPage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String text;

    // MinIO image path - this is the only image field we need
    @Column(name = "image_path")
    private String imagePath;

    private Integer pageOrder;

    @ManyToOne
    @JoinColumn(name = "story_id")
    @JsonBackReference
    private Story story;

    // Add relationship to questions
    @OneToMany(mappedBy = "page", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Question> questions = new ArrayList<>();

    // Flag for migration status - can be removed after full migration
    @Column(name = "image_migrated")
    private boolean imageMigrated = false;

    // Helper method to check if page has image
    public boolean hasImage() {
        return imagePath != null && !imagePath.trim().isEmpty();
    }
}