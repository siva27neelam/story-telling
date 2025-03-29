package com.socialstory.repository;

import com.socialstory.model.StoryArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryArchiveRepository  extends JpaRepository<StoryArchive, Long> {
}
