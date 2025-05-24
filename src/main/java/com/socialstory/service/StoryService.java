package com.socialstory.service;

import com.socialstory.model.*;
import com.socialstory.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final QuestionService questionService;
    private final StoryArchiveRepository storyArchiveRepository;
    private final MinioStorageService minioStorageService;
    private final ImageCompressionService imageCompressionService;
    private final UserStoryInteractionRepository userStoryInteractionRepository;

    @CacheEvict(value = "storiesPageCache", allEntries = true)
    public Story createStory(Story story, List<MultipartFile> pageImages, MultipartFile coverImage) {
        // Set bidirectional relationships for pages
        if (story.getPages() != null) {
            story.getPages().forEach(page -> {
                page.setStory(story);
            });
        }

        story.setStatus(Story.StoryStatus.DRAFT);
        story.setSubmittedForApprovalAt(LocalDateTime.now());

        if (coverImage != null && !coverImage.isEmpty()) {
            try {
                byte[] compressedImage = imageCompressionService.compressImageWithTinyPNG(coverImage.getBytes());
                story.setCoverImage(compressedImage);
                story.setCoverImageType(coverImage.getContentType());

                // If we're directly storing in MinIO
                String coverPath = minioStorageService.uploadCoverImage(
                        coverImage.getBytes(),
                        coverImage.getContentType());
                story.setCoverImagePath(coverPath);
                story.setImageMigrated(true);

            } catch (Exception e) {
                log.error("Error processing cover image: {}", e.getMessage());
            }
        }

        // Process page images
        if (story.getPages() != null && pageImages != null) {
            int pageIndex = 0;
            for (StoryPage page : story.getPages()) {
                if (pageIndex < pageImages.size() && !pageImages.get(pageIndex).isEmpty()) {
                    try {
                        MultipartFile pageImage = pageImages.get(pageIndex);

                        // Store in database for now (will be migrated later)
                        byte[] compressedPageImage = imageCompressionService.compressImageWithTinyPNG(pageImage.getBytes());

                        page.setImageData(compressedPageImage);
                        page.setImageType(pageImage.getContentType());

                        // If we're directly storing in MinIO
                        String imagePath = minioStorageService.uploadPageImage(
                                pageImage.getBytes(),
                                pageImage.getContentType());
                        page.setImagePath(imagePath);
                        page.setImageMigrated(true);

                    } catch (Exception e) {
                        log.error("Error processing page image: {}", e.getMessage());
                    }
                }
                pageIndex++;
            }
        }

        // Save the story first to get IDs
        Story savedStory = storyRepository.save(story);

        // Process questions if any
        processQuestions(savedStory);

        return savedStory;
    }

    @CacheEvict(value = "storiesPageCache", allEntries = true)
    public Story updateStory(Story updatedStory, List<MultipartFile> pageImages,
                             MultipartFile coverImageFile, List<Boolean> keepExistingImages,
                             Boolean keepExistingCover) {

        Story existingStory = storyRepository.findById(updatedStory.getId())
                .orElseThrow(() -> new RuntimeException("Story not found with id: " + updatedStory.getId()));

        // Update basic story properties
        existingStory.setTitle(updatedStory.getTitle());
        existingStory.setTags(updatedStory.getTags());
        existingStory.setStatus(Story.StoryStatus.DRAFT);
        existingStory.setChangedBy(updatedStory.getChangedBy());
        existingStory.setSubmittedForApprovalAt(LocalDateTime.now());

        // Update cover image if provided
        if (coverImageFile != null && !coverImageFile.isEmpty()) {
            try {
                // Handle database storage
                byte[] compressedImage = imageCompressionService.compressImageWithTinyPNG(coverImageFile.getBytes());

                existingStory.setCoverImage(compressedImage);
                existingStory.setCoverImageType(coverImageFile.getContentType());

                // Handle MinIO storage
                String coverPath = minioStorageService.uploadCoverImage(
                        coverImageFile.getBytes(),
                        coverImageFile.getContentType());
                existingStory.setCoverImagePath(coverPath);
                existingStory.setImageMigrated(true);

            } catch (Exception e) {
                log.error("Error processing cover image: {}", e.getMessage(), e);
            }
        } else if (keepExistingCover != null && keepExistingCover) {
            // Keep existing image - do nothing
        } else {
            // Clear the cover image
            existingStory.setCoverImage(null);
            existingStory.setCoverImageType(null);

            // Also clear MinIO path if it exists
            if (existingStory.getCoverImagePath() != null) {
                try {
                    minioStorageService.deleteImage(existingStory.getCoverImagePath(),
                            minioStorageService.getCoversBucket());
                } catch (Exception e) {
                    log.error("Error deleting cover image from MinIO: {}", e.getMessage(), e);
                }
                existingStory.setCoverImagePath(null);
            }
        }

        // Create a map of existing pages by ID for quick lookup
        Map<Long, StoryPage> existingPages = existingStory.getPages().stream()
                .collect(Collectors.toMap(StoryPage::getId, page -> page));

        // Update pages
        if (updatedStory.getPages() != null) {
            List<StoryPage> updatedPages = new ArrayList<>();

            for (int i = 0; i < updatedStory.getPages().size(); i++) {
                StoryPage updatedPage = updatedStory.getPages().get(i);

                if (updatedPage.getId() != null && existingPages.containsKey(updatedPage.getId())) {
                    // This is an existing page - update it
                    StoryPage existingPage = existingPages.get(updatedPage.getId());
                    existingPage.setText(updatedPage.getText());
                    existingPage.setPageOrder(updatedPage.getPageOrder());

                    // Handle image update
                    boolean keepExisting = (keepExistingImages != null &&
                            i < keepExistingImages.size() &&
                            keepExistingImages.get(i));

                    if (pageImages != null && i < pageImages.size() && !pageImages.get(i).isEmpty()) {
                        // New image uploaded
                        try {
                            MultipartFile imageFile = pageImages.get(i);
                            byte[] compressedPageImage = imageCompressionService.compressImageWithTinyPNG(imageFile.getBytes());

                            // Database storage
                            existingPage.setImageData(compressedPageImage);
                            existingPage.setImageType(imageFile.getContentType());

                            // MinIO storage - delete old image if exists
                            if (existingPage.getImagePath() != null) {
                                try {
                                    minioStorageService.deleteImage(existingPage.getImagePath(),
                                            minioStorageService.getPagesBucket());
                                } catch (Exception e) {
                                    log.error("Error deleting page image from MinIO: {}", e.getMessage(), e);
                                }
                            }

                            // Upload new image to MinIO
                            String imagePath = minioStorageService.uploadPageImage(
                                    imageFile.getBytes(),
                                    imageFile.getContentType());
                            existingPage.setImagePath(imagePath);
                            existingPage.setImageMigrated(true);

                        } catch (Exception e) {
                            log.error("Error processing page image: {}", e.getMessage(), e);
                        }
                    } else if (!keepExisting) {
                        // Clear the image if not keeping existing
                        existingPage.setImageData(null);
                        existingPage.setImageType(null);

                        // Also clear MinIO path if it exists
                        if (existingPage.getImagePath() != null) {
                            try {
                                minioStorageService.deleteImage(existingPage.getImagePath(),
                                        minioStorageService.getPagesBucket());
                            } catch (Exception e) {
                                log.error("Error deleting page image from MinIO: {}", e.getMessage(), e);
                            }
                            existingPage.setImagePath(null);
                        }
                    }

                    updatedPages.add(existingPage);
                } else {
                    // This is a new page
                    updatedPage.setStory(existingStory);

                    // Handle new page image if provided
                    if (pageImages != null && i < pageImages.size() && !pageImages.get(i).isEmpty()) {
                        try {
                            MultipartFile imageFile = pageImages.get(i);
                            byte[] compressedPageImage = imageCompressionService.compressImageWithTinyPNG(imageFile.getBytes());

                            // Database storage
                            updatedPage.setImageData(compressedPageImage);
                            updatedPage.setImageType(imageFile.getContentType());

                            // MinIO storage
                            String imagePath = minioStorageService.uploadPageImage(
                                    imageFile.getBytes(),
                                    imageFile.getContentType());
                            updatedPage.setImagePath(imagePath);
                            updatedPage.setImageMigrated(true);

                        } catch (Exception e) {
                            log.error("Error processing page image: {}", e.getMessage(), e);
                        }
                    }

                    updatedPages.add(updatedPage);
                }
            }

            // Delete any pages that are in the database but not in the updated story
            Set<Long> updatedPageIds = updatedPages.stream()
                    .filter(p -> p.getId() != null)
                    .map(StoryPage::getId)
                    .collect(Collectors.toSet());

            List<StoryPage> pagesToDelete = existingStory.getPages().stream()
                    .filter(p -> !updatedPageIds.contains(p.getId()))
                    .collect(Collectors.toList());

            // Delete pages and their images from MinIO
            for (StoryPage pageToDelete : pagesToDelete) {
                if (pageToDelete.getImagePath() != null) {
                    try {
                        minioStorageService.deleteImage(pageToDelete.getImagePath(),
                                minioStorageService.getPagesBucket());
                    } catch (Exception e) {
                        log.error("Error deleting page image from MinIO: {}", e.getMessage(), e);
                    }
                }
            }

            // Replace all pages
            existingStory.getPages().clear();
            existingStory.getPages().addAll(updatedPages);
        }

        // Save the updated story
        Story savedStory = storyRepository.save(existingStory);

        // Process questions
        processQuestions(savedStory);

        return savedStory;
    }

    // Original method for backward compatibility
    public Page<Story> getFullStoriesPage(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return storyRepository.findAll(pageRequest);
    }

    /**
     * Process questions for each page of the story
     */
    private void processQuestions(Story story) {
        if (story.getPages() != null) {
            for (StoryPage page : story.getPages()) {
                // Process questions for this page
                if (page.getQuestions() != null && !page.getQuestions().isEmpty()) {
                    List<Question> questions = new ArrayList<>(page.getQuestions());

                    // Clear existing questions to avoid duplicates
                    questionService.deleteQuestionsByPageId(page.getId());

                    // Add each question
                    for (Question question : questions) {
                        if (question != null && question.getText() != null && !question.getText().isEmpty()) {
                            question.setPage(page);
                            questionService.saveQuestion(question);
                        }
                    }
                }
            }
        }
    }

    public Story getStoryById(Long id) {
        return storyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Story not found with id: " + id));
    }

    public List<Story> getAllStories() {
        return storyRepository.findAll();
    }

    @CacheEvict(value = "storiesPageCache", allEntries = true)
    @Transactional
    public void deleteStory(Long id) {
        log.info("Starting deletion of story with id: {}", id);

        try {
            Story story = storyRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Story not found with id: " + id));

            // Step 1: Delete user story interactions first
            log.info("Deleting user story interactions for story id: {}", id);
            List<UserStoryInteraction> interactions = userStoryInteractionRepository.findByStoryId(id);
            if (!interactions.isEmpty()) {
                userStoryInteractionRepository.deleteAll(interactions);
                log.info("Deleted {} user story interactions", interactions.size());
            }

            // Step 2: Delete images from MinIO if they exist
            log.info("Cleaning up MinIO images for story id: {}", id);

            // Delete cover image from MinIO
            if (story.getCoverImagePath() != null) {
                try {
                    minioStorageService.deleteImage(story.getCoverImagePath(),
                            minioStorageService.getCoversBucket());
                    log.info("Deleted cover image from MinIO: {}", story.getCoverImagePath());
                } catch (Exception e) {
                    log.warn("Failed to delete cover image from MinIO: {}", e.getMessage());
                }
            }

            // Delete page images from MinIO
            if (story.getPages() != null) {
                for (StoryPage page : story.getPages()) {
                    if (page.getImagePath() != null) {
                        try {
                            minioStorageService.deleteImage(page.getImagePath(),
                                    minioStorageService.getPagesBucket());
                            log.info("Deleted page image from MinIO: {}", page.getImagePath());
                        } catch (Exception e) {
                            log.warn("Failed to delete page image from MinIO: {}", e.getMessage());
                        }
                    }
                }
            }

            // Step 3: Delete the story (this will cascade to pages and questions due to JPA cascade settings)
            log.info("Deleting story entity with id: {}", id);
            storyRepository.deleteById(id);

            log.info("Successfully deleted story with id: {}", id);

        } catch (Exception e) {
            log.error("Error deleting story with id {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete story: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Story submitForApproval(Long storyId) {
        Story story = getStoryById(storyId);
        story.setStatus(Story.StoryStatus.PENDING);
        story.setSubmittedForApprovalAt(LocalDateTime.now());
        return storyRepository.save(story);
    }

    @Transactional
    public Story approveStory(Long storyId, String approverEmail) {
        Story story = getStoryById(storyId);
        story.setStatus(Story.StoryStatus.PUBLISHED);
        story.setApprovedBy(approverEmail);
        story.setApprovedAt(LocalDateTime.now());
        return storyRepository.save(story);
    }

    @Transactional
    public void rejectStory(Long storyId, String rejectorEmail, String reason) {
        Story story = getStoryById(storyId);

        // Create archive record
        StoryArchive archive = new StoryArchive();
        archive.setOriginalStoryId(story.getId());
        archive.setTitle(story.getTitle());
        // Copy other relevant fields
        archive.setCreatedAt(story.getCreatedAt());
        archive.setSubmittedAt(story.getSubmittedForApprovalAt());
        archive.setRejectedAt(LocalDateTime.now());
        archive.setRejectedBy(rejectorEmail);
        archive.setRejectionReason(reason);

        storyArchiveRepository.save(archive);

        // Either delete or mark as archived
        story.setStatus(Story.StoryStatus.ARCHIVED);
        storyRepository.save(story);
    }

    @Cacheable(value = "storiesPageCache", key = "#page + '-' + #size")
    public Page<StoryListDTO> getStoriesPage(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return storyRepository.findAllPublishedStoriesForList(pageRequest);
    }

    public Page<StoryListDTO> getPendingStoriesPage(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("submittedForApprovalAt").descending());
        return storyRepository.findPendingStoriesForList(pageRequest);
    }
}