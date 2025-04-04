package com.socialstory.service;

import com.socialstory.model.Story;
import com.socialstory.model.StoryPage;
import com.socialstory.repository.StoryPageRepository;
import com.socialstory.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageMigrationService {

    private final StoryRepository storyRepository;
    private final StoryPageRepository storyPageRepository;
    private final MinioStorageService minioStorageService;

    /**
     * Migrate all images from database to MinIO
     *
     * @param batchSize Number of records to process in each batch
     * @return Migration statistics
     */
    public MigrationStats migrateAllImages(int batchSize) {
        MigrationStats stats = new MigrationStats();

        stats.setCoverStats(migrateCoverImages(batchSize));
        stats.setPageStats(migratePageImages(batchSize));

        return stats;
    }

    /**
     * Migrate story cover images from database to MinIO
     *
     * @param batchSize Number of records to process in each batch
     * @return Migration statistics
     */
    @Transactional
    public MigrationBatchStats migrateCoverImages(int batchSize) {
        MigrationBatchStats stats = new MigrationBatchStats();
        int offset = 0;
        boolean hasMore = true;

        log.info("Starting migration of story cover images");

        while (hasMore) {
            // Find stories with unmigrated cover images
            List<Story> stories = storyRepository.findUnmigratedCoverImages(batchSize, offset);
            hasMore = !stories.isEmpty();

            if (hasMore) {
                log.info("Processing batch of {} cover images", stories.size());

                for (Story story : stories) {
                    try {
                        if (story.getCoverImage() != null && story.getCoverImage().length > 0) {
                            // Upload to MinIO
                            String objectName = minioStorageService.uploadCoverImage(
                                    story.getCoverImage(),
                                    story.getCoverImageType());

                            // Update story with new path
                            story.setCoverImagePath(objectName);
                            story.setImageMigrated(true);
                            storyRepository.save(story);

                            stats.setSuccessCount(stats.getSuccessCount() + 1);
                            stats.setTotalBytes(stats.getTotalBytes() + story.getCoverImage().length);

                            log.debug("Migrated cover image for story ID: {}", story.getId());
                        } else {
                            // Mark as migrated even if no image (to avoid reprocessing)
                            story.setImageMigrated(true);
                            storyRepository.save(story);

                            stats.setSkippedCount(stats.getSkippedCount() + 1);
                            log.debug("Skipped empty cover image for story ID: {}", story.getId());
                        }
                    } catch (Exception e) {
                        stats.setErrorCount(stats.getErrorCount() + 1);
                        log.error("Error migrating cover image for story ID {}: {}",
                                story.getId(), e.getMessage(), e);
                    }
                }

                // Move to next batch
                offset += batchSize;
                log.info("Completed batch. Success: {}, Errors: {}, Skipped: {}",
                        stats.getSuccessCount(), stats.getErrorCount(), stats.getSkippedCount());
            }
        }

        log.info("Completed migration of cover images. Total bytes migrated: {}", stats.getTotalBytes());
        return stats;
    }

    /**
     * Migrate story page images from database to MinIO
     *
     * @param batchSize Number of records to process in each batch
     * @return Migration statistics
     */
    @Transactional
    public MigrationBatchStats migratePageImages(int batchSize) {
        MigrationBatchStats stats = new MigrationBatchStats();
        int offset = 0;
        boolean hasMore = true;

        log.info("Starting migration of story page images");

        while (hasMore) {
            // Find pages with unmigrated images
            List<StoryPage> pages = storyPageRepository.findUnmigratedImages(batchSize, offset);
            hasMore = !pages.isEmpty();

            if (hasMore) {
                log.info("Processing batch of {} page images", pages.size());

                for (StoryPage page : pages) {
                    try {
                        if (page.getImageData() != null && page.getImageData().length > 0) {
                            // Upload to MinIO
                            String objectName = minioStorageService.uploadPageImage(
                                    page.getImageData(),
                                    page.getImageType());

                            // Update page with new path
                            page.setImagePath(objectName);
                            page.setImageMigrated(true);
                            storyPageRepository.save(page);

                            stats.setSuccessCount(stats.getSuccessCount() + 1);
                            stats.setTotalBytes(stats.getTotalBytes() + page.getImageData().length);

                            log.debug("Migrated image for page ID: {}", page.getId());
                        } else {
                            // Mark as migrated even if no image (to avoid reprocessing)
                            page.setImageMigrated(true);
                            storyPageRepository.save(page);

                            stats.setSkippedCount(stats.getSkippedCount() + 1);
                            log.debug("Skipped empty image for page ID: {}", page.getId());
                        }
                    } catch (Exception e) {
                        stats.setErrorCount(stats.getErrorCount() + 1);
                        log.error("Error migrating image for page ID {}: {}",
                                page.getId(), e.getMessage(), e);
                    }
                }

                // Move to next batch
                offset += batchSize;
                log.info("Completed batch. Success: {}, Errors: {}, Skipped: {}",
                        stats.getSuccessCount(), stats.getErrorCount(), stats.getSkippedCount());
            }
        }

        log.info("Completed migration of page images. Total bytes migrated: {}", stats.getTotalBytes());
        return stats;
    }

    /**
     * Stats class to hold migration results
     */
    public static class MigrationStats {
        private MigrationBatchStats coverStats = new MigrationBatchStats();
        private MigrationBatchStats pageStats = new MigrationBatchStats();

        // Getters and setters
        public MigrationBatchStats getCoverStats() {
            return coverStats;
        }

        public void setCoverStats(MigrationBatchStats coverStats) {
            this.coverStats = coverStats;
        }

        public MigrationBatchStats getPageStats() {
            return pageStats;
        }

        public void setPageStats(MigrationBatchStats pageStats) {
            this.pageStats = pageStats;
        }

        public int getTotalSuccess() {
            return coverStats.getSuccessCount() + pageStats.getSuccessCount();
        }

        public int getTotalErrors() {
            return coverStats.getErrorCount() + pageStats.getErrorCount();
        }

        public int getTotalSkipped() {
            return coverStats.getSkippedCount() + pageStats.getSkippedCount();
        }

        public long getTotalBytesMigrated() {
            return coverStats.getTotalBytes() + pageStats.getTotalBytes();
        }
    }

    /**
     * Stats for a single batch migration
     */
    public static class MigrationBatchStats {
        private int successCount = 0;
        private int errorCount = 0;
        private int skippedCount = 0;
        private long totalBytes = 0;

        // Getters and setters
        public int getSuccessCount() {
            return successCount;
        }

        public void setSuccessCount(int successCount) {
            this.successCount = successCount;
        }

        public int getErrorCount() {
            return errorCount;
        }

        public void setErrorCount(int errorCount) {
            this.errorCount = errorCount;
        }

        public int getSkippedCount() {
            return skippedCount;
        }

        public void setSkippedCount(int skippedCount) {
            this.skippedCount = skippedCount;
        }

        public long getTotalBytes() {
            return totalBytes;
        }

        public void setTotalBytes(long totalBytes) {
            this.totalBytes = totalBytes;
        }
    }
}