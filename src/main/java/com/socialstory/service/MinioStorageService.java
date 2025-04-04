package com.socialstory.service;

import io.minio.*;
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
    public String getCoversBucket() {
        return coversBucket;
    }

    public void setCoversBucket(String coversBucket) {
        this.coversBucket = coversBucket;
    }

    public String getPagesBucket() {
        return pagesBucket;
    }

    public void setPagesBucket(String pagesBucket) {
        this.pagesBucket = pagesBucket;
    }

    private final MinioClient minioClient;

    @Value("${minio.bucket.covers}")
    private String coversBucket;

    @Value("${minio.bucket.pages}")
    private String pagesBucket;

    /**
     * Upload image to MinIO
     *
     * @param imageData Image data as byte array
     * @param contentType MIME type of the image
     * @param bucket Bucket name to store the image
     * @return Object name (path) in MinIO
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
            log.error("Error uploading image to MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Error uploading image to MinIO", e);
        }
    }

    /**
     * Upload a story cover image
     *
     * @param imageData Image data
     * @param contentType MIME type
     * @return Object name in MinIO
     */
    public String uploadCoverImage(byte[] imageData, String contentType) {
        return uploadImage(imageData, contentType, coversBucket);
    }

    /**
     * Upload a story page image
     *
     * @param imageData Image data
     * @param contentType MIME type
     * @return Object name in MinIO
     */
    public String uploadPageImage(byte[] imageData, String contentType) {
        return uploadImage(imageData, contentType, pagesBucket);
    }

    /**
     * Get image data from MinIO
     *
     * @param objectName Object name (path)
     * @param bucket Bucket name
     * @return Image data as byte array
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
            log.error("Error getting image from MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Error getting image from MinIO", e);
        }
    }

    /**
     * Get a story cover image
     *
     * @param objectName Object name
     * @return Image data
     */
    public byte[] getCoverImage(String objectName) {
        return getImage(objectName, coversBucket);
    }

    /**
     * Get a story page image
     *
     * @param objectName Object name
     * @return Image data
     */
    public byte[] getPageImage(String objectName) {
        return getImage(objectName, pagesBucket);
    }

    /**
     * Delete image from MinIO
     *
     * @param objectName Object name (path)
     * @param bucket Bucket name
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
            log.error("Error deleting image from MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Error deleting image from MinIO", e);
        }
    }

    /**
     * Generate a unique object name for storage
     *
     * @param contentType MIME type to determine file extension
     * @return Unique object name
     */
    private String generateObjectName(String contentType) {
        String extension = getExtensionFromContentType(contentType);
        return UUID.randomUUID().toString() + "." + extension;
    }

    /**
     * Get file extension from content type
     *
     * @param contentType MIME type
     * @return File extension
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
}