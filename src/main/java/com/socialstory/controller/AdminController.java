package com.socialstory.controller;

import com.socialstory.service.UserAdminService;
import com.socialstory.service.UserService;
import com.socialstory.service.StoryService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final StoryService storyService;
    private final UserAdminService userAdminService;

    @GetMapping
    public String adminDashboard(Model model, HttpSession session) {
        com.socialstory.model.User currentUser = (com.socialstory.model.User) session.getAttribute("currentUser");
        if (currentUser == null || !userAdminService.isUserAdmin(currentUser.getEmail())) {
            return "redirect:/stories";
        }

        // Get metrics from user service
        Map<String, Object> metrics = userService.getMetricsForAdminDashboard();

        // Add total stories count
        metrics.put("totalStories", storyService.getAllStories().size());

        // Get story data for chart
        List<Long> topStoryIds = (List<Long>) metrics.get("topStories");
        List<Map<String, Object>> storyData = new ArrayList<>();

        if (topStoryIds != null && !topStoryIds.isEmpty()) {
            for (Long storyId : topStoryIds) {
                Map<String, Object> storyMap = new HashMap<>();
                storyMap.put("title", storyService.getStoryById(storyId).getTitle());
                storyMap.put("readCount", userService.getStoryReadCount(storyId));
                storyData.add(storyMap);
            }
        }
        metrics.put("storyData", storyData);

        // Generate activity data for last 7 days
        List<Map<String, Object>> activityData = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.format(formatter));
            dayData.put("activeUsers", userService.getActiveUsersForDate(date));
            activityData.add(dayData);
        }
        metrics.put("activityData", activityData);

        // Get recent activities
        model.addAttribute("recentActivities", userService.getRecentActivities(10));
        model.addAttribute("metrics", metrics);

        return "admin/index";
    }
}