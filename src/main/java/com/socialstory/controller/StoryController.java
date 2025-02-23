package com.socialstory.controller;

import com.socialstory.model.Story;
import com.socialstory.model.StoryPage;
import com.socialstory.service.FileStorageService;
import com.socialstory.service.StoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/stories")
public class StoryController {

    private final StoryService storyService;
    private final FileStorageService fileStorageService;

    @Autowired
    public StoryController(StoryService storyService, FileStorageService fileStorageService) {
        this.storyService = storyService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public String listStories(Model model) {
        model.addAttribute("stories", storyService.getAllStories());
        return "story/list";
    }

    @GetMapping("/create")
    public String showCreateForm(Model model) {
        model.addAttribute("story", new Story());
        return "story/create";
    }

    @PostMapping("/create")
    public String createStory(@ModelAttribute Story story,
                              @RequestParam(name = "audioFile", required = false) List<MultipartFile> audioFiles,
                              @RequestParam(name = "imageFile", required = false) List<MultipartFile> imageFiles,
                              RedirectAttributes redirectAttributes) {

        // Process audio file uploads if any

        if (audioFiles != null && !audioFiles.isEmpty() && story.getPages() != null) {
            for (int i = 0; i < story.getPages().size() && i < audioFiles.size(); i++) {
                MultipartFile audioFile = audioFiles.get(i);
                if (audioFile != null && !audioFile.isEmpty()) {
                    String fileName = fileStorageService.storeFile(audioFile);
                    story.getPages().get(i).setAudioUrl("/uploads/" + fileName);
                }
            }
        }

        // Process image file uploads if any
        if (imageFiles != null && !imageFiles.isEmpty() && story.getPages() != null) {
            for (int i = 0; i < story.getPages().size() && i < imageFiles.size(); i++) {
                MultipartFile imageFile = imageFiles.get(i);
                if (imageFile != null && !imageFile.isEmpty()) {
                    String fileName = fileStorageService.storeFile(imageFile);
                    story.getPages().get(i).setImageUrl("/uploads/" + fileName);
                }
            }
        }

        // Set page order and link pages to story
        if (story.getPages() != null) {
            for (int i = 0; i < story.getPages().size(); i++) {
                StoryPage page = story.getPages().get(i);
                page.setPageOrder(i);
                page.setStory(story);
            }
        }

        storyService.createStory(story);
        redirectAttributes.addFlashAttribute("message", "Story created successfully!");
        return "redirect:/stories";
    }

    @GetMapping("/view/{id}")
    public String viewStory(@PathVariable Long id, Model model) {
        Story story = storyService.getStoryById(id);
        model.addAttribute("story", story);
        return "story/view";
    }

    // Add these new methods to your existing StoryController.java

    @GetMapping("/edit/{id}")
    public String editStory(@PathVariable Long id, Model model) {
        Story story = storyService.getStoryById(id);
        model.addAttribute("story", story);
        return "story/edit";
    }

    @PostMapping("/edit/{id}")
    public String updateStory(@PathVariable Long id,
                              @ModelAttribute Story updatedStory,
                              @RequestParam(name = "audioFile", required = false) List<MultipartFile> audioFiles,
                              @RequestParam(name = "imageFile", required = false) List<MultipartFile> imageFiles,
                              @RequestParam(name = "keepExistingImage", required = false) List<Boolean> keepExistingImages,
                              @RequestParam(name = "keepExistingAudio", required = false) List<Boolean> keepExistingAudios,
                              RedirectAttributes redirectAttributes) {

        Story existingStory = storyService.getStoryById(id);
        updatedStory.setId(id);

        // Process image and audio files
        if (updatedStory.getPages() != null) {
            for (int i = 0; i < updatedStory.getPages().size(); i++) {
                StoryPage page = updatedStory.getPages().get(i);

                // Handle images
                if (imageFiles != null && i < imageFiles.size() && !imageFiles.get(i).isEmpty()) {
                    String fileName = fileStorageService.storeFile(imageFiles.get(i));
                    page.setImageUrl("/uploads/" + fileName);
                } else if (keepExistingImages != null && i < keepExistingImages.size() && keepExistingImages.get(i)) {
                    page.setImageUrl(existingStory.getPages().get(i).getImageUrl());
                }

                // Handle audio
                if (audioFiles != null && i < audioFiles.size() && !audioFiles.get(i).isEmpty()) {
                    String fileName = fileStorageService.storeFile(audioFiles.get(i));
                    page.setAudioUrl("/uploads/" + fileName);
                } else if (keepExistingAudios != null && i < keepExistingAudios.size() && keepExistingAudios.get(i)) {
                    page.setAudioUrl(existingStory.getPages().get(i).getAudioUrl());
                }

                page.setPageOrder(i);
                page.setStory(updatedStory);
            }
        }

        storyService.updateStory(updatedStory);
        redirectAttributes.addFlashAttribute("message", "Story updated successfully!");
        return "redirect:/stories";
    }

    @GetMapping("/delete/{id}")
    public String deleteStory(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        storyService.deleteStory(id);
        redirectAttributes.addFlashAttribute("message", "Story deleted successfully!");
        return "redirect:/stories";
    }
}