package com.socialstory.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryListDTO {
    private Long id;
    private String title;
    private String tags;
    private boolean hasCoverImage;
    private String changedBy;
    private LocalDateTime submittedForApprovalAt;

}