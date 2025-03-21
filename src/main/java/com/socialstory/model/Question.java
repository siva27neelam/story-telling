package com.socialstory.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The text of the question
    @Column(columnDefinition = "TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String text;

    // First option (choice)
    @Column(columnDefinition = "TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String option1;

    // Second option (choice)
    @Column(columnDefinition = "TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String option2;

    // Index of the correct answer (0 or 1)
    private Integer correctOptionIndex;

    // Reference to the page this question belongs to
    @ManyToOne
    @JoinColumn(name = "page_id")
    @JsonBackReference
    private StoryPage page;
}