package com.socialstory.controller;

import com.socialstory.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
public class InteractionApiController {

    private final UserService userService;

    @PostMapping("/{id}/time")
    public ResponseEntity<?> updateTimeSpent(@PathVariable Long id, @RequestBody Map<String, Long> data) {
        userService.updateTimeSpent(id, data.get("seconds"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/question")
    public ResponseEntity<?> recordQuestionAnswer(@PathVariable Long id, @RequestBody Map<String, Boolean> data) {
        userService.recordQuestionAnswered(id, data.get("correct"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> markStoryComplete(@PathVariable Long id) {
        userService.markStoryComplete(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable Long id) {
        boolean isFavorite = userService.toggleFavorite(id);
        return ResponseEntity.ok().body(Map.of("favorite", isFavorite));
    }
}