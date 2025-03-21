// QuestionService.java - Add methods to handle questions
package com.socialstory.service;

import com.socialstory.model.Question;
import com.socialstory.model.StoryPage;
import com.socialstory.repository.QuestionRepository;
import com.socialstory.repository.StoryPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final StoryPageRepository storyPageRepository;

    /**
     * Save a question
     */
    public Question saveQuestion(Question question) {
        return questionRepository.save(question);
    }

    /**
     * Create a new question for a story page
     */
    public Question createQuestion(Question question, Long pageId) {
        StoryPage page = storyPageRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + pageId));

        question.setPage(page);
        return questionRepository.save(question);
    }

    /**
     * Get a question by ID
     */
    public Question getQuestionById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + id));
    }

    /**
     * Get all questions for a specific page
     */
    public List<Question> getQuestionsByPageId(Long pageId) {
        return questionRepository.findByPageId(pageId);
    }

    /**
     * Get all questions for a specific story
     */
    public List<Question> getQuestionsByStoryId(Long storyId) {
        return questionRepository.findByStoryId(storyId);
    }

    /**
     * Update a question
     */
    public Question updateQuestion(Question question) {
        Question existingQuestion = questionRepository.findById(question.getId())
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + question.getId()));

        existingQuestion.setText(question.getText());
        existingQuestion.setOption1(question.getOption1());
        existingQuestion.setOption2(question.getOption2());
        existingQuestion.setCorrectOptionIndex(question.getCorrectOptionIndex());

        return questionRepository.save(existingQuestion);
    }

    /**
     * Delete a question
     */
    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }

    /**
     * Delete all questions for a page
     */
    public void deleteQuestionsByPageId(Long pageId) {
        List<Question> questions = questionRepository.findByPageId(pageId);
        questionRepository.deleteAll(questions);
    }
}