package com.socialstory.config;

import io.minio.MinioClient;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket.covers}")
    private String coversBucket;

    @Value("${minio.bucket.pages}")
    private String pagesBucket;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    @PostConstruct
    public void initializeBuckets() throws Exception {
        MinioClient client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();

        // Create buckets if they don't exist
        if (!client.bucketExists(io.minio.BucketExistsArgs.builder().bucket(coversBucket).build())) {
            client.makeBucket(io.minio.MakeBucketArgs.builder().bucket(coversBucket).build());
        }

        if (!client.bucketExists(io.minio.BucketExistsArgs.builder().bucket(pagesBucket).build())) {
            client.makeBucket(io.minio.MakeBucketArgs.builder().bucket(pagesBucket).build());
        }
    }


}