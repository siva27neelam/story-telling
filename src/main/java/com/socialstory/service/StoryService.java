package com.socialstory.service;

import com.socialstory.model.Story;
import com.socialstory.model.StoryPage;
import com.socialstory.repository.StoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.util.List;

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

    public Story updateStory(Story story) {
        if (story.getPages() != null) {
            story.getPages().forEach(page -> {
                page.setStory(story);
            });
        }
        return storyRepository.save(story);
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