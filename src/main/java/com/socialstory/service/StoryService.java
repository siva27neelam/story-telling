// StoryService.java - Updated to handle all fields
package com.socialstory.service;

import com.socialstory.model.Question;
import com.socialstory.model.Story;
import com.socialstory.model.StoryPage;
import com.socialstory.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.transaction.Transactional;
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

    public Story createStory(Story story) {
        // Set bidirectional relationships for pages
        if (story.getPages() != null) {
            story.getPages().forEach(page -> {
                page.setStory(story);
            });
        }

        // Save the story first to get IDs
        Story savedStory = storyRepository.save(story);

        // Process questions if any
        processQuestions(savedStory);

        return savedStory;
    }

    public Story updateStory(Story updatedStory) {
        Story existingStory = storyRepository.findById(updatedStory.getId())
                .orElseThrow(() -> new RuntimeException("Story not found with id: " + updatedStory.getId()));

        // Update basic story properties
        existingStory.setTitle(updatedStory.getTitle());
        existingStory.setTags(updatedStory.getTags());

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

    public void deleteStory(Long id) {
        storyRepository.deleteById(id);
    }
}