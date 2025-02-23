package com.socialstory.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Base64;

@Service
public class DatabaseFileService {

    public byte[] getImageData(MultipartFile file) throws IOException {
        return file.getBytes();
    }

    public String getImageType(MultipartFile file) {
        return file.getContentType();
    }

    // Convert byte array to Base64 string for display in HTML
    public String getImageBase64(byte[] imageData, String imageType) {
        if (imageData == null) return null;
        return "data:" + imageType + ";base64," + Base64.getEncoder().encodeToString(imageData);
    }
}