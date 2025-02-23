package com.socialstory.repository;

import com.socialstory.model.StoryPage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoryPageRepository extends JpaRepository<StoryPage, Long> {
}