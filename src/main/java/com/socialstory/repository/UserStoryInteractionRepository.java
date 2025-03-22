package com.socialstory.repository;

import com.socialstory.model.UserStoryInteraction;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserStoryInteractionRepository extends JpaRepository<UserStoryInteraction, Long> {
    Optional<UserStoryInteraction> findByUserIdAndStoryId(Long userId, Long storyId);

    List<UserStoryInteraction> findByUserId(Long userId);

    List<UserStoryInteraction> findByStoryId(Long storyId);

    @Query("SELECT usi.story.id FROM UserStoryInteraction usi GROUP BY usi.story.id ORDER BY COUNT(usi) DESC")
    List<Long> findMostReadStories();

    @Query("SELECT usi.story.id FROM UserStoryInteraction usi GROUP BY usi.story.id ORDER BY AVG(usi.timeSpent) DESC")
    List<Long> findStoriesWithMostTimeSpent();

    @Query("SELECT usi.story.id FROM UserStoryInteraction usi WHERE usi.favorite = true GROUP BY usi.story.id ORDER BY COUNT(usi) DESC")
    List<Long> findMostFavoritedStories();

    @Query("SELECT COUNT(DISTINCT usi.user.id) FROM UserStoryInteraction usi WHERE usi.story.id = ?1")
    Long countUniqueReadersForStory(Long storyId);

    @Query("SELECT usi FROM UserStoryInteraction usi ORDER BY usi.lastReadAt DESC")
    List<UserStoryInteraction> findRecentInteractions(Pageable pageable);

    default List<UserStoryInteraction> findRecentInteractions(int limit) {
        return findRecentInteractions(PageRequest.of(0, limit));
    }
}