package com.socialstory.controller;

import com.socialstory.model.Story;
import com.socialstory.model.StoryPage;
import com.socialstory.service.StoryService;
import com.socialstory.repository.StoryPageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import java.util.List;
import java.util.ArrayList;

@Controller
@RequestMapping("/stories")
public class StoryController {

    private final StoryService storyService;
    private final StoryPageRepository storyPageRepository;

    @Autowired
    public StoryController(StoryService storyService, StoryPageRepository storyPageRepository) {
        this.storyService = storyService;
        this.storyPageRepository = storyPageRepository;
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
                              @RequestParam(value = "imageFile", required = false) List<MultipartFile> images,
                              RedirectAttributes redirectAttributes) {
        // Initialize pages list if null
        if (story.getPages() == null) {
            story.setPages(new ArrayList<>());
        }

        // Process images if they exist
        if (images != null) {
            for (int i = 0; i < story.getPages().size(); i++) {
                StoryPage page = story.getPages().get(i);
                if (i < images.size() && !images.get(i).isEmpty()) {
                    try {
                        page.setImageData(images.get(i).getBytes());
                        page.setImageType(images.get(i).getContentType());
                    } catch (Exception e) {
                        // Log error and continue
                        e.printStackTrace();
                    }
                }
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

    @GetMapping("/image/{pageId}")
    @ResponseBody
    public ResponseEntity<byte[]> getImage(@PathVariable Long pageId) {
        StoryPage page = storyPageRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found"));

        if (page.getImageData() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(page.getImageType()))
                .body(page.getImageData());
    }

    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable Long id, Model model) {
        Story story = storyService.getStoryById(id);
        model.addAttribute("story", story);
        return "story/edit";
    }

    @PostMapping("/edit/{id}")
    public String updateStory(@PathVariable Long id,
                              @ModelAttribute Story story,
                              @RequestParam(value = "imageFile", required = false) List<MultipartFile> images,
                              @RequestParam(value = "keepExistingImage", required = false) List<Boolean> keepExistingImages,
                              RedirectAttributes redirectAttributes) {
        Story existingStory = storyService.getStoryById(id);
        story.setId(id);

        // Process images
        if (story.getPages() != null) {
            for (int i = 0; i < story.getPages().size(); i++) {
                StoryPage page = story.getPages().get(i);

                // Keep existing image if specified
                boolean keepExisting = keepExistingImages != null &&
                        i < keepExistingImages.size() &&
                        keepExistingImages.get(i);

                if (keepExisting && i < existingStory.getPages().size()) {
                    StoryPage existingPage = existingStory.getPages().get(i);
                    page.setImageData(existingPage.getImageData());
                    page.setImageType(existingPage.getImageType());
                }

                // Process new image if uploaded
                if (images != null && i < images.size() && !images.get(i).isEmpty()) {
                    try {
                        page.setImageData(images.get(i).getBytes());
                        page.setImageType(images.get(i).getContentType());
                    } catch (Exception e) {
                        // Log error and continue
                        e.printStackTrace();
                    }
                }
            }
        }

        storyService.updateStory(story);
        redirectAttributes.addFlashAttribute("message", "Story updated successfully!");
        return "redirect:/stories";
    }

    @GetMapping("/delete/{id}")
    public String deleteStory(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        storyService.deleteStory(id);
        redirectAttributes.addFlashAttribute("message", "Story deleted successfully!");
        return "redirect:/stories";
    }

    // Debug endpoint
    @GetMapping("/debug/page/{pageId}")
    @ResponseBody
    public String debugPage(@PathVariable Long pageId) {
        StoryPage page = storyPageRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found"));

        return String.format(
                "Page ID: %d\nImage Type: %s\nImage Data Length: %d bytes",
                page.getId(),
                page.getImageType(),
                page.getImageData() != null ? page.getImageData().length : 0
        );
    }
}