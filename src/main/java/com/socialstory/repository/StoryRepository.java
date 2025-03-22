package com.socialstory.repository;

import com.socialstory.dto.StoryListDTO;
import com.socialstory.model.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    Page<Story> findByTagsContaining(String tag, Pageable pageable);

    Page<Story> findByTitleContainingIgnoreCase(String titleKeyword, Pageable pageable);

    @Query("SELECT new com.socialstory.dto.StoryListDTO(s.id, s.title, s.tags, CASE WHEN s.coverImage IS NULL THEN false ELSE true END) FROM Story s ORDER BY s.createdAt DESC")
    Page<StoryListDTO> findAllStoriesForList(Pageable pageable);
}