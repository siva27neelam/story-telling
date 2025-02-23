package com.socialstory.service;

import com.socialstory.model.Story;
import com.socialstory.model.StoryPage;
import com.socialstory.repository.StoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class StoryService {

    private final StoryRepository storyRepository;

    @Autowired
    public StoryService(StoryRepository storyRepository) {
        this.storyRepository = storyRepository;
    }

    public Story createStory(Story story) {
        if (story.getPages() != null) {
            story.getPages().forEach(page -> {
                page.setStory(story);
            });
        }
        return storyRepository.save(story);
    }

    public Story updateStory(Story updatedStory) {
        Story existingStory = storyRepository.findById(updatedStory.getId())
                .orElseThrow(() -> new RuntimeException("Story not found with id: " + updatedStory.getId()));

        // Update basic story properties
        existingStory.setTitle(updatedStory.getTitle());

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

        return storyRepository.save(existingStory);
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