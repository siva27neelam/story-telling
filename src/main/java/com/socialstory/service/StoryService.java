// StoryService.java - Updated to handle all fields
package com.socialstory.service;

import com.socialstory.model.*;
import com.socialstory.repository.StoryArchiveRepository;
import com.socialstory.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final QuestionService questionService;
    private final StoryArchiveRepository storyArchiveRepository;

    @CacheEvict(value = "storiesPageCache", allEntries = true)
    public Story createStory(Story story) {
        // Set bidirectional relationships for pages
        if (story.getPages() != null) {
            story.getPages().forEach(page -> {
                page.setStory(story);
            });
        }

        story.setStatus(Story.StoryStatus.DRAFT);
        //story.setChangedBy(currentUser.getUsername());
        story.setSubmittedForApprovalAt(LocalDateTime.now());
        // Save the story first to get IDs
        Story savedStory = storyRepository.save(story);

        // Process questions if any
        processQuestions(savedStory);

        return savedStory;
    }

    @CacheEvict(value = "storiesPageCache", allEntries = true)
    public Story updateStory(Story updatedStory) {
        Story existingStory = storyRepository.findById(updatedStory.getId())
                .orElseThrow(() -> new RuntimeException("Story not found with id: " + updatedStory.getId()));

        // Update basic story properties
        existingStory.setTitle(updatedStory.getTitle());
        existingStory.setTags(updatedStory.getTags());
        existingStory.setStatus(Story.StoryStatus.DRAFT);
        //existingStory.setChangedBy(currentUser.getUsername());
        existingStory.setSubmittedForApprovalAt(LocalDateTime.now());

        // Update cover image if provided
        if (updatedStory.getCoverImage() != null) {
            existingStory.setCoverImage(updatedStory.getCoverImage());
            existingStory.setCoverImageType(updatedStory.getCoverImageType());
        }

        // Create a map of existing pages by ID for quick lookup
        Map<Long, StoryPage> existingPages = existingStory.getPages().stream()
                .collect(Collectors.toMap(StoryPage::getId, page -> page));

        // Update pages
        if (updatedStory.getPages() != null) {
            List<StoryPage> updatedPages = new ArrayList<>();

            for (StoryPage updatedPage : updatedStory.getPages()) {
                if (updatedPage.getId() != null && existingPages.containsKey(updatedPage.getId())) {
                    // This is an existing page - update while preserving image data
                    StoryPage existingPage = existingPages.get(updatedPage.getId());
                    existingPage.setText(updatedPage.getText());
                    existingPage.setPageOrder(updatedPage.getPageOrder());
                    // Keep existing image data and type unless new ones are provided
                    if (updatedPage.getImageData() == null) {
                        updatedPage.setImageData(existingPage.getImageData());
                        updatedPage.setImageType(existingPage.getImageType());
                    }
                    updatedPage.setStory(existingStory);
                    updatedPages.add(updatedPage);
                } else {
                    // This is a new page
                    updatedPage.setStory(existingStory);
                    updatedPages.add(updatedPage);
                }
            }

            existingStory.getPages().clear();
            existingStory.getPages().addAll(updatedPages);
        }

        // Save the updated story
        Story savedStory = storyRepository.save(existingStory);

        // Process questions
        processQuestions(savedStory);

        return savedStory;
    }

    // Original method for backward compatibility
    public Page<Story> getFullStoriesPage(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return storyRepository.findAll(pageRequest);
    }

    /**
     * Process questions for each page of the story
     */
    private void processQuestions(Story story) {
        if (story.getPages() != null) {
            for (StoryPage page : story.getPages()) {
                // Process questions for this page
                if (page.getQuestions() != null && !page.getQuestions().isEmpty()) {
                    List<Question> questions = new ArrayList<>(page.getQuestions());

                    // Clear existing questions to avoid duplicates
                    questionService.deleteQuestionsByPageId(page.getId());

                    // Add each question
                    for (Question question : questions) {
                        if (question != null && question.getText() != null && !question.getText().isEmpty()) {
                            question.setPage(page);
                            questionService.saveQuestion(question);
                        }
                    }
                }
            }
        }
    }

    public Story getStoryById(Long id) {
        return storyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Story not found with id: " + id));
    }

    public List<Story> getAllStories() {
        return storyRepository.findAll();
    }

    @CacheEvict(value = "storiesPageCache", allEntries = true)
    public void deleteStory(Long id) {
        storyRepository.deleteById(id);
    }

    @Transactional
    public Story submitForApproval(Long storyId) {
        Story story = getStoryById(storyId);
        story.setStatus(Story.StoryStatus.PENDING);
        story.setSubmittedForApprovalAt(LocalDateTime.now());
        return storyRepository.save(story);
    }

    @Transactional
    public Story approveStory(Long storyId, String approverEmail) {
        Story story = getStoryById(storyId);
        story.setStatus(Story.StoryStatus.PUBLISHED);
        story.setApprovedBy(approverEmail);
        story.setApprovedAt(LocalDateTime.now());
        return storyRepository.save(story);
    }

    @Transactional
    public void rejectStory(Long storyId, String rejectorEmail, String reason) {
        Story story = getStoryById(storyId);

        // Create archive record
        StoryArchive archive = new StoryArchive();
        archive.setOriginalStoryId(story.getId());
        archive.setTitle(story.getTitle());
        // Copy other relevant fields
        archive.setCreatedAt(story.getCreatedAt());
        archive.setSubmittedAt(story.getSubmittedForApprovalAt());
        archive.setRejectedAt(LocalDateTime.now());
        archive.setRejectedBy(rejectorEmail);
        archive.setRejectionReason(reason);

        storyArchiveRepository.save(archive);

        // Either delete or mark as archived
        story.setStatus(Story.StoryStatus.ARCHIVED);
        storyRepository.save(story);
    }

    // In getStoriesPage method - update to only get PUBLISHED stories
    @Cacheable(value = "storiesPageCache", key = "#page + '-' + #size")
    public Page<StoryListDTO> getStoriesPage(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return storyRepository.findAllPublishedStoriesForList(pageRequest);
    }

    // New method to get pending stories
    public Page<StoryListDTO> getPendingStoriesPage(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("submittedForApprovalAt").descending());
        return storyRepository.findPendingStoriesForList(pageRequest);
    }
}