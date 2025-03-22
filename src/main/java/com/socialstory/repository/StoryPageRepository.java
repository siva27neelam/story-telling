package com.socialstory.repository;

import com.socialstory.model.StoryPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StoryPageRepository extends JpaRepository<StoryPage, Long> {
    @Query("SELECT p FROM StoryPage p WHERE (p.isImageCompressed = false OR p.isImageCompressed IS NULL) AND p.imageData IS NOT NULL")
    List<StoryPage> findUncompressedImages(int limit, int offset);
}