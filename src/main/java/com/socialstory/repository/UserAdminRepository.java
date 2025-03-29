package com.socialstory.repository;

import com.socialstory.model.UserAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAdminRepository extends JpaRepository<UserAdmin, Long> {
    Optional<UserAdmin> findByEmail(String email);
    boolean existsByEmailAndAccountType(String email, UserAdmin.AccountType accountType);
}