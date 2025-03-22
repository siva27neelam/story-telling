package com.socialstory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoryListDTO {
    private Long id;
    private String title;
    private String tags;
    private boolean hasCoverImage;

}