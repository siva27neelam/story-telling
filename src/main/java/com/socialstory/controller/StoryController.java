// StoryController.java - Complete file with MinIO-only implementation
package com.socialstory.controller;

import com.socialstory.model.*;
import com.socialstory.service.*;
import com.socialstory.repository.StoryPageRepository;
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
    private final MinioStorageService minioStorageService;

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

        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser != null) {
            story.setChangedBy(currentUser.getEmail());
        }

        story.setStatus(Story.StoryStatus.DRAFT);

        // Save the story (service handles images and questions)
        storyService.createStory(story, images, coverImageFile);
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
                              RedirectAttributes redirectAttributes,
                              HttpSession session) {

        story.setId(id);

        // Set user information
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser != null) {
            story.setChangedBy(currentUser.getEmail());
        }

        // Update the story (service handles images and questions)
        // Removed keepExistingImages and keepExistingCover parameters
        storyService.updateStory(story, images, coverImageFile, null, null);
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

    // REST endpoints for questions
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

    // Image endpoints - MinIO only, no database fallbacks
    @GetMapping("/image/{pageId}")
    @ResponseBody
    public ResponseEntity<byte[]> getImage(@PathVariable Long pageId) {
        StoryPage page = storyPageRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found"));

        // MinIO only - no fallbacks
        if (page.getImagePath() != null && !page.getImagePath().trim().isEmpty()) {
            try {
                byte[] imageData = minioStorageService.getPageImage(page.getImagePath());
                if (imageData != null && imageData.length > 0) {
                    String contentType = determineContentType(page.getImagePath());
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(contentType))
                            .header("Cache-Control", "max-age=604800, public") // 7 days cache
                            .body(imageData);
                }
            } catch (Exception e) {
                log.error("Failed to get image from MinIO for page {}: {}", pageId, e.getMessage());
            }
        }

        // No image found
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/cover/{id}")
    @ResponseBody
    public ResponseEntity<byte[]> getCoverImage(@PathVariable Long id) {
        Story story = storyService.getStoryById(id);

        // MinIO only - no fallbacks
        if (story.getCoverImagePath() != null && !story.getCoverImagePath().trim().isEmpty()) {
            try {
                byte[] imageData = minioStorageService.getCoverImage(story.getCoverImagePath());
                if (imageData != null && imageData.length > 0) {
                    String contentType = determineContentType(story.getCoverImagePath());
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(contentType))
                            .header("Cache-Control", "max-age=604800, public") // 7 days cache
                            .body(imageData);
                }
            } catch (Exception e) {
                log.error("Failed to get cover image from MinIO for story {}: {}", id, e.getMessage());
            }
        }

        // No image found
        return ResponseEntity.notFound().build();
    }

    /**
     * Determine content type from file path
     */
    private String determineContentType(String path) {
        if (path == null) {
            return "image/jpeg"; // Default
        }

        path = path.toLowerCase();
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (path.endsWith(".png")) {
            return "image/png";
        } else if (path.endsWith(".gif")) {
            return "image/gif";
        } else if (path.endsWith(".webp")) {
            return "image/webp";
        } else {
            return "image/jpeg"; // Default
        }
    }
}