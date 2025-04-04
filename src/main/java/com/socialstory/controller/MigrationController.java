package com.socialstory.controller;

import com.socialstory.service.ImageMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final ImageMigrationService migrationService;

    @GetMapping
    public String migrationDashboard(Model model) {
        // Display migration dashboard
        return "admin/migration";
    }

    @PostMapping("/start")
    @ResponseBody
    public ImageMigrationService.MigrationStats startMigration(
            @RequestParam(defaultValue = "50") int batchSize) {
        // Start migration process
        return migrationService.migrateAllImages(batchSize);
    }

    @GetMapping("/status")
    @ResponseBody
    public String getMigrationStatus() {
        // Get current migration status
        // This would require keeping state in the migration service
        return "Migration status information";
    }
}