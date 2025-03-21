// QuestionRepository.java - Updated with needed query methods
package com.socialstory.repository;

import com.socialstory.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // Find all questions for a specific page
    List<Question> findByPageId(Long pageId);

    // Find all questions for a specific story
    @Query("SELECT q FROM Question q JOIN q.page p WHERE p.story.id = :storyId")
    List<Question> findByStoryId(@Param("storyId") Long storyId);
}