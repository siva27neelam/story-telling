package com.socialstory.repository;

import com.socialstory.model.StoryPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StoryPageRepository extends JpaRepository<StoryPage, Long> {
    @Query("SELECT p FROM StoryPage p WHERE (p.isImageCompressed = false OR p.isImageCompressed IS NULL) AND p.imageData IS NOT NULL")
    List<StoryPage> findUncompressedImages(int limit, int offset);

    @Query("SELECT p FROM StoryPage p WHERE (p.imageMigrated = false OR p.imageMigrated IS NULL) AND p.imageData IS NOT NULL ORDER BY p.id")
    List<StoryPage> findUnmigratedImages(@Param("limit") int limit, @Param("offset") int offset);

}