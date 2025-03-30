package com.socialstory.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RedirectController {
    @GetMapping("/")
    public String redirectToStories() {
        return "redirect:/stories";
    }

    @GetMapping("/about")
    public String aboutPage() {
        return "about"; // This will use about.html template
    }
}
