package com.socialstory.service;

import com.socialstory.model.Story;
import com.socialstory.model.StoryPage;
import com.socialstory.repository.StoryPageRepository;
import com.socialstory.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImageCompressionBatchService {

    private final StoryRepository storyRepository;
    private final StoryPageRepository storyPageRepository;

    // Max dimensions for story page images
    private static final int MAX_WIDTH = 800;
    private static final int MAX_HEIGHT = 600;

    // Max dimensions for cover images (can be larger)
    private static final int MAX_COVER_WIDTH = 1200;
    private static final int MAX_COVER_HEIGHT = 800;

    // Compression quality (0.0-1.0)
    private static final float COMPRESSION_QUALITY = 0.8f;

    // Process in batches to avoid memory issues
    private static final int BATCH_SIZE = 20;

    // Run everyday at 2 AM
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void compressImages() {
        log.info("Starting scheduled image compression job");

        int coverImagesCompressed = 0;
        int pageImagesCompressed = 0;
        long spaceSavedBytes = 0;

        // Process story cover images in batches
        List<Story> stories;
        int storyPage = 0;

        do {
            stories = storyRepository.findUncompressedCoverImages(BATCH_SIZE, storyPage * BATCH_SIZE);
            log.info("Processing batch {} of uncompressed cover images, found {}", storyPage + 1, stories.size());

            for (Story story : stories) {
                if (story.getCoverImage() != null && !Boolean.TRUE.equals(story.getIsCoverCompressed())) {
                    try {
                        long originalSize = story.getCoverImage().length;
                        byte[] compressed = compressImage(
                                story.getCoverImage(),
                                story.getCoverImageType(),
                                MAX_COVER_WIDTH,
                                MAX_COVER_HEIGHT
                        );

                        // Update if compression was successful
                        if (compressed.length < originalSize) {
                            story.setCoverImage(compressed);
                            spaceSavedBytes += (originalSize - compressed.length);
                            coverImagesCompressed++;
                            log.debug("Compressed cover image for story ID {}, saved {} bytes",
                                    story.getId(), (originalSize - compressed.length));
                        }

                        // Mark as processed regardless of outcome
                        story.setIsCoverCompressed(true);
                        storyRepository.save(story);

                    } catch (Exception e) {
                        log.error("Error compressing cover image for story ID {}: {}",
                                story.getId(), e.getMessage());
                    }
                }
            }

            storyPage++;
        } while (!stories.isEmpty());

        // Process page images in batches
        List<StoryPage> pages;
        int pagePage = 0;

        do {
            pages = storyPageRepository.findUncompressedImages(BATCH_SIZE, pagePage * BATCH_SIZE);
            log.info("Processing batch {} of uncompressed page images, found {}", pagePage + 1, pages.size());

            for (StoryPage page : pages) {
                if (page.getImageData() != null && !Boolean.TRUE.equals(page.getIsImageCompressed())) {
                    try {
                        long originalSize = page.getImageData().length;
                        byte[] compressed = compressImage(
                                page.getImageData(),
                                page.getImageType(),
                                MAX_WIDTH,
                                MAX_HEIGHT
                        );

                        // Update if compression was successful
                        if (compressed.length < originalSize) {
                            page.setImageData(compressed);
                            spaceSavedBytes += (originalSize - compressed.length);
                            pageImagesCompressed++;
                            log.debug("Compressed image for page ID {}, saved {} bytes",
                                    page.getId(), (originalSize - compressed.length));
                        }

                        // Mark as processed regardless of outcome
                        page.setIsImageCompressed(true);
                        storyPageRepository.save(page);

                    } catch (Exception e) {
                        log.error("Error compressing image for page ID {}: {}",
                                page.getId(), e.getMessage());
                    }
                }
            }

            pagePage++;
        } while (!pages.isEmpty());

        double spaceSavedMB = spaceSavedBytes / (1024.0 * 1024.0);
        log.info("Image compression job completed: {} cover images compressed, {} page images compressed, {:.2f} MB saved",
                coverImagesCompressed, pageImagesCompressed, spaceSavedMB);
    }

    /**
     * Compress an image to the specified dimensions while maintaining aspect ratio
     */
    private byte[] compressImage(byte[] imageData, String contentType, int maxWidth, int maxHeight) throws IOException {
        // Skip processing if not an image
        if (contentType == null || !contentType.startsWith("image/")) {
            return imageData;
        }

        // Convert byte array to BufferedImage
        ByteArrayInputStream inputStream = new ByteArrayInputStream(imageData);
        BufferedImage originalImage = ImageIO.read(inputStream);

        // Skip null images
        if (originalImage == null) {
            return imageData;
        }

        // Prepare output stream
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Determine output format
        String format = "jpeg";
        if (contentType.contains("png")) {
            format = "png";
        } else if (contentType.contains("gif")) {
            format = "gif";
        }

        // Resize and compress the image
        Thumbnails.of(originalImage)
                .size(maxWidth, maxHeight)
                .keepAspectRatio(true)
                .outputQuality(COMPRESSION_QUALITY)
                .outputFormat(format)
                .toOutputStream(outputStream);

        return outputStream.toByteArray();
    }
}