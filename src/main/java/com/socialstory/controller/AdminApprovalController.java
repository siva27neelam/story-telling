// AdminApprovalController.java
package com.socialstory.controller;

import com.socialstory.model.Story;
import com.socialstory.model.User;
import com.socialstory.service.StoryService;
import com.socialstory.service.UserAdminService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin/approvals")
@RequiredArgsConstructor
public class AdminApprovalController {

    private final StoryService storyService;
    private final UserAdminService userAdminService;

    @GetMapping
    public String approvalDashboard(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            Model model,
            HttpSession session) {

        // Check if user is admin
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !userAdminService.isUserAdmin(currentUser.getEmail())) {
            return "redirect:/stories";
        }

        // Get pending stories
        Page<com.socialstory.model.StoryListDTO> pendingStories = storyService.getPendingStoriesPage(page, size);

        model.addAttribute("stories", pendingStories.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", pendingStories.getTotalPages());

        return "admin/approvals";
    }

    @GetMapping("/view/{id}")
    public String viewStory(@PathVariable Long id, Model model, HttpSession session) {
        // Check if user is admin
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !userAdminService.isUserAdmin(currentUser.getEmail())) {
            return "redirect:/stories";
        }

        Story story = storyService.getStoryById(id);
        model.addAttribute("story", story);
        model.addAttribute("isApprovalView", true);

        return "story/view";
    }

    @CacheEvict(value = "storiesPageCache", allEntries = true)
    @PostMapping("/approve/{id}")
    public String approveStory(@PathVariable Long id, HttpSession session) {
        // Check if user is admin
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !userAdminService.isUserAdmin(currentUser.getEmail())) {
            return "redirect:/stories";
        }

        storyService.approveStory(id, currentUser.getEmail());
        return "redirect:/admin/approvals";
    }

    @PostMapping("/reject/{id}")
    public String rejectStory(
            @PathVariable Long id,
            @RequestParam String reason,
            HttpSession session) {

        // Check if user is admin
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null || !userAdminService.isUserAdmin(currentUser.getEmail())) {
            return "redirect:/stories";
        }

        storyService.rejectStory(id, currentUser.getEmail(), reason);
        return "redirect:/admin/approvals";
    }
}