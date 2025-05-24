package com.socialstory.service;

import io.minio.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService {

    private final MinioClient minioClient;

    // Getter methods for bucket names (for compatibility)
    @Getter
    @Value("${minio.bucket.covers}")
    private String coversBucket;

    @Getter
    @Value("${minio.bucket.pages}")
    private String pagesBucket;

    // Add CDN URLs for both buckets
    @Value("${minio.covers-url:}")
    private String coversUrl;

    @Value("${minio.pages-url:}")
    private String pagesUrl;

    // Fallback to single URL if separate URLs not configured
    @Value("${minio.public-url:}")
    private String publicUrl;

    /**
     * Upload image to R2/MinIO
     */
    public String uploadImage(byte[] imageData, String contentType, String bucket) {
        if (imageData == null || imageData.length == 0) {
            throw new IllegalArgumentException("Image data cannot be null or empty");
        }

        String objectName = generateObjectName(contentType);

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(imageData)) {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("Content-Type", contentType);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(inputStream, imageData.length, -1)
                            .contentType(contentType)
                            .headers(metadata)
                            .build());

            log.info("Successfully uploaded image to bucket: {}, object: {}", bucket, objectName);
            return objectName;

        } catch (Exception e) {
            log.error("Error uploading image: {}", e.getMessage(), e);
            throw new RuntimeException("Error uploading image", e);
        }
    }

    /**
     * Upload a story cover image
     */
    public String uploadCoverImage(byte[] imageData, String contentType) {
        return uploadImage(imageData, contentType, coversBucket);
    }

    /**
     * Upload a story page image
     */
    public String uploadPageImage(byte[] imageData, String contentType) {
        return uploadImage(imageData, contentType, pagesBucket);
    }

    /**
     * Get image data from storage
     */
    public byte[] getImage(String objectName, String bucket) {
        try {
            GetObjectResponse response = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build());

            return response.readAllBytes();
        } catch (Exception e) {
            log.error("Error getting image: {}", e.getMessage(), e);
            throw new RuntimeException("Error getting image", e);
        }
    }

    /**
     * Get a story cover image
     */
    public byte[] getCoverImage(String objectName) {
        return getImage(objectName, coversBucket);
    }

    /**
     * Get a story page image
     */
    public byte[] getPageImage(String objectName) {
        return getImage(objectName, pagesBucket);
    }

    /**
     * Get CDN URL for cover image
     */
    public String getPublicCoverImageUrl(String objectName) {
        if (coversUrl != null && !coversUrl.isEmpty()) {
            // Use dedicated covers CDN URL
            return coversUrl + "/" + objectName;
        } else if (publicUrl != null && !publicUrl.isEmpty()) {
            // Use single CDN URL with path
            return publicUrl + "/covers/" + objectName;
        } else {
            // No CDN configured, return null (will use controller endpoints)
            return null;
        }
    }

    /**
     * Get CDN URL for page image
     */
    public String getPublicPageImageUrl(String objectName) {
        if (pagesUrl != null && !pagesUrl.isEmpty()) {
            // Use dedicated pages CDN URL
            return pagesUrl + "/" + objectName;
        } else if (publicUrl != null && !publicUrl.isEmpty()) {
            // Use single CDN URL with path
            return publicUrl + "/pages/" + objectName;
        } else {
            // No CDN configured, return null (will use controller endpoints)
            return null;
        }
    }

    /**
     * Delete image from storage
     */
    public void deleteImage(String objectName, String bucket) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build());

            log.info("Successfully deleted image from bucket: {}, object: {}", bucket, objectName);
        } catch (Exception e) {
            log.error("Error deleting image: {}", e.getMessage(), e);
            throw new RuntimeException("Error deleting image", e);
        }
    }

    /**
     * Upload a cover image (overwrite if exists with same object name)
     */
    public void uploadCoverImage(byte[] imageData, String contentType, String objectName) {
        uploadImage(imageData, contentType, coversBucket, objectName);
    }

    /**
     * Upload a page image (overwrite if exists with same object name)
     */
    public void uploadPageImage(byte[] imageData, String contentType, String objectName) {
        uploadImage(imageData, contentType, pagesBucket, objectName);
    }

    /**
     * Upload image with a specific object name
     */
    private void uploadImage(byte[] imageData, String contentType, String bucket, String objectName) {
        if (imageData == null || imageData.length == 0) {
            throw new IllegalArgumentException("Image data cannot be null or empty");
        }

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(imageData)) {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("Content-Type", contentType);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(inputStream, imageData.length, -1)
                            .contentType(contentType)
                            .headers(metadata)
                            .build());

            log.info("Successfully uploaded image to bucket: {}, object: {}", bucket, objectName);
        } catch (Exception e) {
            log.error("Error uploading image: {}", e.getMessage(), e);
            throw new RuntimeException("Error uploading image", e);
        }
    }

    /**
     * Generate a unique object name for storage
     */
    private String generateObjectName(String contentType) {
        String extension = getExtensionFromContentType(contentType);
        return UUID.randomUUID().toString() + "." + extension;
    }

    /**
     * Get file extension from content type
     */
    private String getExtensionFromContentType(String contentType) {
        if (contentType == null) {
            return "jpg"; // Default extension
        }

        if (contentType.contains("jpeg") || contentType.contains("jpg")) {
            return "jpg";
        } else if (contentType.contains("png")) {
            return "png";
        } else if (contentType.contains("gif")) {
            return "gif";
        } else if (contentType.contains("webp")) {
            return "webp";
        } else {
            return "jpg"; // Default extension
        }
    }

    // Expose MinioClient for advanced operations if needed
    public MinioClient minioClient() {
        return minioClient;
    }
}