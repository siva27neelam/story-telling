package com.socialstory.service;

import io.minio.ListObjectsArgs;
import io.minio.Result;
import io.minio.messages.Item;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImageCompressionService {

    private final MinioStorageService minioStorageService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${tinypng.api.key}")
    private String apiKey;

    @Value("${minio.bucket.covers}")
    private String coversBucket;

    @Value("${minio.bucket.pages}")
    private String pagesBucket;

    // Flag to track if a compression job is running
    private final AtomicBoolean isCompressionJobRunning = new AtomicBoolean(false);

    /**
     * Compress all images in MinIO buckets
     * @return Compression statistics
     */
    public CompressionStats compressAllImages() {
        if (isCompressionJobRunning.compareAndSet(false, true)) {
            try {
                log.info("Starting TinyPNG image compression for all MinIO images");
                CompressionStats stats = new CompressionStats();

                // Compress cover images
                CompressionBatchStats coverStats = compressImagesInBucket(coversBucket);
                stats.setCoverStats(coverStats);

                // Compress page images
                CompressionBatchStats pageStats = compressImagesInBucket(pagesBucket);
                stats.setPageStats(pageStats);

                log.info("Completed TinyPNG compression. Total saved: {} bytes",
                        stats.getTotalBytesSaved());

                return stats;
            } catch (Exception e) {
                log.error("Error in TinyPNG compression job: {}", e.getMessage(), e);
                throw e;
            } finally {
                isCompressionJobRunning.set(false);
            }
        } else {
            throw new RuntimeException("Another compression job is already running");
        }
    }

    /**
     * Compress images in a specific bucket
     * @param bucketName The MinIO bucket to process
     * @return Statistics about the compression
     */
    private CompressionBatchStats compressImagesInBucket(String bucketName) {
        CompressionBatchStats stats = new CompressionBatchStats();

        try {
            log.info("Starting compression of images in bucket: {}", bucketName);

            // List all objects in the bucket
            Iterable<Result<Item>> results = minioStorageService.minioClient().listObjects(
                    ListObjectsArgs.builder().bucket(bucketName).recursive(true).build());

            for (Result<Item> result : results) {
                Item item = result.get();
                String objectName = item.objectName();

                try {
                    log.debug("Processing object: {}", objectName);

                    // Get image from MinIO
                    byte[] imageData;
                    if (bucketName.equals(coversBucket)) {
                        imageData = minioStorageService.getCoverImage(objectName);
                    } else {
                        imageData = minioStorageService.getPageImage(objectName);
                    }

                    if (imageData != null && imageData.length > 0) {
                        // Track original size
                        long originalSize = imageData.length;

                        // Skip very small images (likely already compressed)
                        if (originalSize < 5000) {
                            log.debug("Skipping small image ({}): {}", originalSize, objectName);
                            stats.skippedCount++;
                            continue;
                        }

                        // Compress with TinyPNG
                        byte[] compressedData = compressImageWithTinyPNG(imageData);

                        if (compressedData != null && compressedData.length > 0) {
                            if (compressedData.length < originalSize) {
                                // Calculate size savings
                                long sizeReduction = originalSize - compressedData.length;
                                float percentReduction = (float) sizeReduction / originalSize * 100;

                                // If compression saved significant space (>5%), update the image
                                if (percentReduction > 5) {
                                    stats.totalBytesSaved += sizeReduction;
                                    stats.successCount++;

                                    // Replace image in MinIO with compressed version
                                    String contentType = determineContentType(objectName);

                                    if (bucketName.equals(coversBucket)) {
                                        minioStorageService.uploadCoverImage(compressedData, contentType, objectName);
                                    } else {
                                        minioStorageService.uploadPageImage(compressedData, contentType, objectName);
                                    }

                                    log.info("Compressed image {}, saved {} bytes ({}%)",
                                            objectName, sizeReduction, Math.round(percentReduction));
                                } else {
                                    // Not worth updating for small savings
                                    stats.skippedCount++;
                                    log.debug("Skipping minor compression for {}: only {}% reduction",
                                            objectName, Math.round(percentReduction));
                                }
                            } else {
                                // Image already optimized
                                stats.skippedCount++;
                                log.debug("Image already optimized: {}", objectName);
                            }
                        } else {
                            // Compression failed
                            stats.errorCount++;
                            log.warn("Failed to compress image: {}", objectName);
                        }
                    } else {
                        // No image data found
                        stats.skippedCount++;
                        log.debug("No image data for: {}", objectName);
                    }
                } catch (Exception e) {
                    stats.errorCount++;
                    log.error("Error processing object {}: {}", objectName, e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error listing objects in bucket {}: {}", bucketName, e.getMessage(), e);
        }

        log.info("Compression complete for bucket {}. Success: {}, Errors: {}, Skipped: {}, Bytes saved: {}",
                bucketName, stats.successCount, stats.errorCount, stats.skippedCount, stats.totalBytesSaved);

        return stats;
    }

    /**
     * Compress an image using TinyPNG API
     * @param imageData Original image data
     * @return Compressed image data
     */
    public byte[] compressImageWithTinyPNG(byte[] imageData) {
        try {
            // Create auth header with API key
            String auth = "Basic " + Base64.getEncoder().encodeToString(("api:" + apiKey).getBytes());

            // Set up headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", auth);
            headers.setContentType(MediaType.IMAGE_PNG); // TinyPNG auto-detects format

            // Create request entity
            HttpEntity<byte[]> requestEntity = new HttpEntity<>(imageData, headers);

            // Send to TinyPNG API
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    "https://api.tinify.com/shrink",
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );

            // Get URL to download the compressed image
            Map<String, Object> body = responseEntity.getBody();
            if (body != null && body.containsKey("output")) {
                Map<String, Object> output = (Map<String, Object>) body.get("output");
                if (output.containsKey("url")) {
                    String url = (String) output.get("url");

                    // Download the compressed image
                    ResponseEntity<byte[]> compressedImageResponse = restTemplate.getForEntity(url, byte[].class);
                    return compressedImageResponse.getBody();
                }
            }

            return null;
        } catch (Exception e) {
            log.error("Error compressing image with TinyPNG: {}", e.getMessage(), e);
            return null;
        }
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

    /**
     * Statistics for a compression batch
     */
    public static class CompressionBatchStats {
        private int successCount = 0;
        private int errorCount = 0;
        private int skippedCount = 0;
        private long totalBytesSaved = 0;

        public int getSuccessCount() {
            return successCount;
        }

        public int getErrorCount() {
            return errorCount;
        }

        public int getSkippedCount() {
            return skippedCount;
        }

        public long getTotalBytesSaved() {
            return totalBytesSaved;
        }
    }

    /**
     * Overall compression statistics
     */
    public static class CompressionStats {
        private CompressionBatchStats coverStats = new CompressionBatchStats();
        private CompressionBatchStats pageStats = new CompressionBatchStats();

        public CompressionBatchStats getCoverStats() {
            return coverStats;
        }

        public void setCoverStats(CompressionBatchStats coverStats) {
            this.coverStats = coverStats;
        }

        public CompressionBatchStats getPageStats() {
            return pageStats;
        }

        public void setPageStats(CompressionBatchStats pageStats) {
            this.pageStats = pageStats;
        }

        public int getTotalSuccess() {
            return coverStats.successCount + pageStats.successCount;
        }

        public int getTotalErrors() {
            return coverStats.errorCount + pageStats.errorCount;
        }

        public int getTotalSkipped() {
            return coverStats.skippedCount + pageStats.skippedCount;
        }

        public long getTotalBytesSaved() {
            return coverStats.totalBytesSaved + pageStats.totalBytesSaved;
        }
    }
}