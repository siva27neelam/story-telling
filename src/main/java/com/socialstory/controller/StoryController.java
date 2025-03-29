// StoryController.java - Updated to use DTOs for the list page
package com.socialstory.controller;

import com.socialstory.model.*;
import com.socialstory.service.QuestionService;
import com.socialstory.service.StoryService;
import com.socialstory.repository.StoryPageRepository;
import com.socialstory.service.UserAdminService;
import com.socialstory.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.*;

@Slf4j
@Controller
@RequestMapping("/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;
    private final StoryPageRepository storyPageRepository;
    private final QuestionService questionService;
    private final UserService userService;
    private final UserAdminService userAdminService;

    @GetMapping
    public String listStories(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "6") int size,
            Model model,
            Authentication authentication,
            HttpSession session) {

        // 6 stories per page (3 rows x 2 columns)
        Page<StoryListDTO> storyPage = storyService.getStoriesPage(page, size);

        model.addAttribute("stories", storyPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", storyPage.getTotalPages());
        model.addAttribute("totalItems", storyPage.getTotalElements());

        // Add unread story indicator data for logged-in users
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser != null) {
            Set<Long> unreadStories = userService.getUnreadStoryIds(currentUser.getId());
            model.addAttribute("unreadStories", unreadStories);
            model.addAttribute("user", currentUser);
        }

        return "story/list";
    }

    // Rest of the controller remains the same
    @GetMapping("/create")
    public String showCreateForm(Model model) {
        model.addAttribute("story", new Story());
        return "story/create";
    }

    @PostMapping("/create")
    public String createStory(@ModelAttribute Story story,
                              @RequestParam(value = "imageFile", required = false) List<MultipartFile> images,
                              @RequestParam(value = "coverImageFile", required = false) MultipartFile coverImageFile,
                              RedirectAttributes redirectAttributes, HttpSession session) {
        // Initialize pages list if null
        if (story.getPages() == null) {
            story.setPages(new ArrayList<>());
        }

        // Process cover image if provided
        if (coverImageFile != null && !coverImageFile.isEmpty()) {
            try {
                story.setCoverImage(coverImageFile.getBytes());
                story.setCoverImageType(coverImageFile.getContentType());
            } catch (Exception e) {
                log.error("Error processing cover image: {}", e.getMessage());
            }
        }

        // Process page images if they exist
        if (images != null) {
            for (int i = 0; i < story.getPages().size(); i++) {
                StoryPage page = story.getPages().get(i);
                if (i < images.size() && !images.get(i).isEmpty()) {
                    try {
                        page.setImageData(images.get(i).getBytes());
                        page.setImageType(images.get(i).getContentType());
                    } catch (Exception e) {
                        log.error("Error processing page image: {}", e.getMessage());
                    }
                }
            }
        }

        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser != null) {
            story.setChangedBy(currentUser.getEmail());
        }

        story.setStatus(Story.StoryStatus.DRAFT);


        // Save the story (service handles questions)
        storyService.createStory(story);
        redirectAttributes.addFlashAttribute("message", "Story created successfully and submitted for approval!");
        return "redirect:/stories";
    }

    @PostMapping("/submit/{id}")
    public String submitForApproval(@PathVariable Long id,
                                    RedirectAttributes redirectAttributes,
                                    HttpSession session) {
        Story story = storyService.getStoryById(id);

        // Set user information
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser != null) {
            story.setChangedBy(currentUser.getEmail());
        }

        storyService.submitForApproval(id);
        redirectAttributes.addFlashAttribute("message", "Story submitted for approval!");
        return "redirect:/stories";
    }


    @GetMapping("/view/{id}")
    public String viewStory(@PathVariable Long id, Model model, HttpSession session) {
        Story story = storyService.getStoryById(id);
        model.addAttribute("story", story);

        // Add questions for each page to the model
        Map<Long, List<Question>> questionsByPage = new HashMap<>();
        for (StoryPage page : story.getPages()) {
            List<Question> questions = questionService.getQuestionsByPageId(page.getId());
            questionsByPage.put(page.getId(), questions);
        }
        model.addAttribute("questionsByPage", questionsByPage);

        // Record interaction if user is logged in
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser != null) {
            UserStoryInteraction interaction = userService.recordStoryInteraction(
                    currentUser, id, 0, false);
            model.addAttribute("interactionId", interaction.getId());
        }

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
                .header("Cache-Control", "max-age=604800, public") // 7 days cache
                .body(page.getImageData());
    }

    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable Long id, Model model, HttpSession session) {
        // Get current user
        User currentUser = (User) session.getAttribute("currentUser");

        // Check if user is admin
        boolean isAdmin = currentUser != null && userAdminService.isUserAdmin(currentUser.getEmail());
        model.addAttribute("isAdmin", isAdmin);

        Story story = storyService.getStoryById(id);
        model.addAttribute("story", story);

        // Add questions for each page to the model
        Map<Long, List<Question>> questionsByPage = new HashMap<>();
        for (StoryPage page : story.getPages()) {
            List<Question> questions = questionService.getQuestionsByPageId(page.getId());
            questionsByPage.put(page.getId(), questions);
        }
        model.addAttribute("questionsByPage", questionsByPage);

        return "story/edit";
    }

    @PostMapping("/edit/{id}")
    public String updateStory(@PathVariable Long id,
                              @ModelAttribute Story story,
                              @RequestParam(value = "imageFile", required = false) List<MultipartFile> images,
                              @RequestParam(value = "coverImageFile", required = false) MultipartFile coverImageFile,
                              @RequestParam(value = "keepExistingImage", required = false) List<Boolean> keepExistingImages,
                              @RequestParam(value = "keepExistingCover", required = false) Boolean keepExistingCover,
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
                        log.error("Error processing page image: {}", e.getMessage());
                    }
                }
            }
        }

        // Process cover image
        if (keepExistingCover != null && keepExistingCover) {
            story.setCoverImage(existingStory.getCoverImage());
            story.setCoverImageType(existingStory.getCoverImageType());
        } else if (coverImageFile != null && !coverImageFile.isEmpty()) {
            try {
                story.setCoverImage(coverImageFile.getBytes());
                story.setCoverImageType(coverImageFile.getContentType());
            } catch (Exception e) {
                log.error("Error processing cover image: {}", e.getMessage());
            }
        }

        // Update the story (service handles questions)
        storyService.updateStory(story);
        redirectAttributes.addFlashAttribute("message", "Story updated successfully!");
        return "redirect:/stories";
    }

    @GetMapping("/delete/{id}")
    public String deleteStory(@PathVariable Long id, RedirectAttributes redirectAttributes, HttpSession session) {

        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return "redirect:/login";
        }

        // Check if user is admin
        if (!userAdminService.isUserAdmin(currentUser.getEmail())) {
            redirectAttributes.addFlashAttribute("error", "You don't have permission to delete stories.");
            return "redirect:/stories";
        }

        storyService.deleteStory(id);
        redirectAttributes.addFlashAttribute("message", "Story deleted successfully!");
        return "redirect:/stories";
    }

    @GetMapping("/cover/{id}")
    @ResponseBody
    public ResponseEntity<byte[]> getCoverImage(@PathVariable Long id) {
        Story story = storyService.getStoryById(id);

        if (story.getCoverImage() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(story.getCoverImageType()))
                .header("Cache-Control", "max-age=604800, public") // 7 days cache
                .body(story.getCoverImage());
    }

    // REST endpoints for questions remain the same
    @GetMapping("/api/pages/{pageId}/questions")
    @ResponseBody
    public ResponseEntity<List<Question>> getQuestionsForPage(@PathVariable Long pageId) {
        List<Question> questions = questionService.getQuestionsByPageId(pageId);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/api/stories/{storyId}/questions")
    @ResponseBody
    public ResponseEntity<List<Question>> getQuestionsForStory(@PathVariable Long storyId) {
        List<Question> questions = questionService.getQuestionsByStoryId(storyId);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/api/pages/{pageId}/questions")
    @ResponseBody
    public ResponseEntity<Question> addQuestion(@PathVariable Long pageId, @RequestBody Question question) {
        Question savedQuestion = questionService.createQuestion(question, pageId);
        return ResponseEntity.ok(savedQuestion);
    }

    @PutMapping("/api/questions/{id}")
    @ResponseBody
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody Question question) {
        question.setId(id);
        Question updatedQuestion = questionService.updateQuestion(question);
        return ResponseEntity.ok(updatedQuestion);
    }

    @DeleteMapping("/api/questions/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Boolean>> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        return ResponseEntity.ok(response);
    }
}