package com.socialstory.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    private String imageUrl;
    private String audioUrl;
    private Integer pageOrder;

    @ManyToOne
    @JoinColumn(name = "story_id")
    private Story story;
}