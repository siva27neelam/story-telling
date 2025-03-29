package com.socialstory.repository;

import com.socialstory.model.Story;
import com.socialstory.model.StoryListDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    Page<Story> findByTagsContaining(String tag, Pageable pageable);

    Page<Story> findByTitleContainingIgnoreCase(String titleKeyword, Pageable pageable);

    @Query("SELECT new com.socialstory.model.StoryListDTO(s.id, s.title, s.tags, CASE WHEN s.coverImage IS NULL THEN false ELSE true END, s.changedBy, s.submittedForApprovalAt) FROM Story s ORDER BY s.createdAt DESC")
    Page<StoryListDTO> findAllStoriesForList(Pageable pageable);

    @Query("SELECT s FROM Story s WHERE (s.isCoverCompressed = false OR s.isCoverCompressed IS NULL) AND s.coverImage IS NOT NULL")
    List<Story> findUncompressedCoverImages(int limit, int offset);

    // StoryRepository.java - add these methods
    @Query("SELECT new com.socialstory.model.StoryListDTO(s.id, s.title, s.tags, CASE WHEN s.coverImage IS NULL THEN false ELSE true END,  s.changedBy, s.submittedForApprovalAt) FROM Story s WHERE s.status = 'PUBLISHED' ORDER BY s.createdAt DESC")
    Page<StoryListDTO> findAllPublishedStoriesForList(Pageable pageable);

    @Query("SELECT new com.socialstory.model.StoryListDTO(s.id, s.title, s.tags, CASE WHEN s.coverImage IS NULL THEN false ELSE true END, s.changedBy, s.submittedForApprovalAt) FROM Story s WHERE s.status = 'DRAFT' ORDER BY s.submittedForApprovalAt DESC")
    Page<StoryListDTO> findPendingStoriesForList(Pageable pageable);
}