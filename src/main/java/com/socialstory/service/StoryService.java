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
import java.util.*;
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

        // Process cover image - MinIO only
        if (coverImage != null && !coverImage.isEmpty()) {
            try {
                String coverPath = minioStorageService.uploadCoverImage(
                        coverImage.getBytes(),
                        coverImage.getContentType());
                story.setCoverImagePath(coverPath);
                story.setImageMigrated(true);
            } catch (Exception e) {
                log.error("Error processing cover image: {}", e.getMessage(), e);
            }
        }

        // Process page images - MinIO only
        if (story.getPages() != null && pageImages != null) {
            int pageIndex = 0;
            for (StoryPage page : story.getPages()) {
                if (pageIndex < pageImages.size() && !pageImages.get(pageIndex).isEmpty()) {
                    try {
                        MultipartFile pageImage = pageImages.get(pageIndex);
                        String imagePath = minioStorageService.uploadPageImage(
                                pageImage.getBytes(),
                                pageImage.getContentType());
                        page.setImagePath(imagePath);
                        page.setImageMigrated(true);
                    } catch (Exception e) {
                        log.error("Error processing page image: {}", e.getMessage(), e);
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
                // Delete old MinIO image if exists
                if (existingStory.getCoverImagePath() != null) {
                    try {
                        minioStorageService.deleteImage(existingStory.getCoverImagePath(),
                                minioStorageService.getCoversBucket());
                    } catch (Exception e) {
                        log.warn("Error deleting old cover image from MinIO: {}", e.getMessage());
                    }
                }

                // Upload new image to MinIO
                String coverPath = minioStorageService.uploadCoverImage(
                        coverImageFile.getBytes(),
                        coverImageFile.getContentType());
                existingStory.setCoverImagePath(coverPath);
                existingStory.setImageMigrated(true);

            } catch (Exception e) {
                log.error("Error processing cover image: {}", e.getMessage(), e);
            }
        }

        // Create a map of existing pages by ID for quick lookup
        Map<Long, StoryPage> existingPages = existingStory.getPages().stream()
                .collect(Collectors.toMap(StoryPage::getId, page -> page));

        // Create a map to store new questions for each page
        Map<Long, List<Question>> pageQuestionsMap = new HashMap<>();

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

                    // Store questions separately
                    if (updatedPage.getQuestions() != null) {
                        pageQuestionsMap.put(existingPage.getId(), new ArrayList<>(updatedPage.getQuestions()));
                    } else {
                        pageQuestionsMap.put(existingPage.getId(), new ArrayList<>());
                    }

                    // Handle image update
                    if (pageImages != null && i < pageImages.size() && !pageImages.get(i).isEmpty()) {
                        // New image uploaded - replace existing
                        try {
                            MultipartFile imageFile = pageImages.get(i);

                            // Delete old MinIO image if exists
                            if (existingPage.getImagePath() != null) {
                                try {
                                    minioStorageService.deleteImage(existingPage.getImagePath(),
                                            minioStorageService.getPagesBucket());
                                } catch (Exception e) {
                                    log.warn("Error deleting old page image from MinIO: {}", e.getMessage());
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
                    }

                    updatedPages.add(existingPage);
                } else {
                    // This is a new page
                    updatedPage.setStory(existingStory);

                    // Handle new page image if provided
                    if (pageImages != null && i < pageImages.size() && !pageImages.get(i).isEmpty()) {
                        try {
                            MultipartFile imageFile = pageImages.get(i);
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
                        log.warn("Error deleting page image from MinIO: {}", e.getMessage());
                    }
                }
            }

            // Replace all pages
            existingStory.getPages().clear();
            existingStory.getPages().addAll(updatedPages);
        }

        // Save the updated story first
        Story savedStory = storyRepository.save(existingStory);

        // Now handle questions separately to avoid Hibernate collection issues
        for (StoryPage page : savedStory.getPages()) {
            if (pageQuestionsMap.containsKey(page.getId())) {
                List<Question> questionsForPage = pageQuestionsMap.get(page.getId());

                // Delete existing questions first
                questionService.deleteQuestionsByPageId(page.getId());

                // Save new questions
                for (Question question : questionsForPage) {
                    if (question != null && question.getText() != null && !question.getText().isEmpty()) {
                        // Create a fresh question object
                        Question newQuestion = new Question();
                        newQuestion.setText(question.getText());
                        newQuestion.setOption1(question.getOption1());
                        newQuestion.setOption2(question.getOption2());
                        newQuestion.setCorrectOptionIndex(question.getCorrectOptionIndex());
                        newQuestion.setPage(page);

                        questionService.saveQuestion(newQuestion);
                    }
                }
            }
        }

        return savedStory;
    }

    // Original method for backward compatibility
    public Page<Story> getFullStoriesPage(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return storyRepository.findAll(pageRequest);
    }

    /**
     * Process questions for each page of the story (used for story creation)
     */
    private void processQuestions(Story story) {
        if (story.getPages() != null) {
            for (int pageIndex = 0; pageIndex < story.getPages().size(); pageIndex++) {
                StoryPage page = story.getPages().get(pageIndex);

                // First, delete all existing questions for this page to avoid conflicts
                if (page.getId() != null) {
                    questionService.deleteQuestionsByPageId(page.getId());
                }

                // Process questions for this page
                if (page.getQuestions() != null && !page.getQuestions().isEmpty()) {
                    List<Question> questions = new ArrayList<>(page.getQuestions());

                    // Add each question as a new entity
                    for (Question question : questions) {
                        if (question != null && question.getText() != null && !question.getText().isEmpty()) {
                            // Create a fresh question object to avoid Hibernate issues
                            Question newQuestion = new Question();
                            newQuestion.setText(question.getText());
                            newQuestion.setOption1(question.getOption1());
                            newQuestion.setOption2(question.getOption2());
                            newQuestion.setCorrectOptionIndex(question.getCorrectOptionIndex());
                            newQuestion.setPage(page);

                            questionService.saveQuestion(newQuestion);
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

            // Step 2: Delete images from MinIO
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

            // Step 3: Delete the story
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
        archive.setCreatedAt(story.getCreatedAt());
        archive.setSubmittedAt(story.getSubmittedForApprovalAt());
        archive.setRejectedAt(LocalDateTime.now());
        archive.setRejectedBy(rejectorEmail);
        archive.setRejectionReason(reason);

        storyArchiveRepository.save(archive);

        // Mark as archived
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