package com.socialstory.repository;

import com.socialstory.model.Story;
import com.socialstory.model.StoryListDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    Page<Story> findByTagsContaining(String tag, Pageable pageable);

    Page<Story> findByTitleContainingIgnoreCase(String titleKeyword, Pageable pageable);

    // Updated to check MinIO path instead of database blob
    @Query("SELECT new com.socialstory.model.StoryListDTO(s.id, s.title, s.tags, CASE WHEN s.coverImagePath IS NOT NULL THEN true ELSE false END, s.changedBy, s.submittedForApprovalAt) FROM Story s ORDER BY s.createdAt DESC")
    Page<StoryListDTO> findAllStoriesForList(Pageable pageable);

    // Updated to check MinIO path for published stories
    @Query("SELECT new com.socialstory.model.StoryListDTO(s.id, s.title, s.tags, CASE WHEN s.coverImagePath IS NOT NULL THEN true ELSE false END, s.changedBy, s.submittedForApprovalAt) FROM Story s WHERE s.status = 'PUBLISHED' ORDER BY s.createdAt DESC")
    Page<StoryListDTO> findAllPublishedStoriesForList(Pageable pageable);

    // Updated to check MinIO path for pending stories
    @Query("SELECT new com.socialstory.model.StoryListDTO(s.id, s.title, s.tags, CASE WHEN s.coverImagePath IS NOT NULL THEN true ELSE false END, s.changedBy, s.submittedForApprovalAt) FROM Story s WHERE s.status = 'DRAFT' ORDER BY s.submittedForApprovalAt DESC")
    Page<StoryListDTO> findPendingStoriesForList(Pageable pageable);

    // Remove old compression-related queries as they're no longer needed
    @Query("SELECT s FROM Story s WHERE (s.imageMigrated = false OR s.imageMigrated IS NULL) AND s.coverImagePath IS NOT NULL ORDER BY s.id")
    List<Story> findUnmigratedCoverImages(@Param("limit") int limit, @Param("offset") int offset);
}