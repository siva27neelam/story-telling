package com.socialstory.repository;

import com.socialstory.model.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    Page<Story> findByTagsContaining(String tag, Pageable pageable);

    Page<Story> findByTitleContainingIgnoreCase(String titleKeyword, Pageable pageable);
}