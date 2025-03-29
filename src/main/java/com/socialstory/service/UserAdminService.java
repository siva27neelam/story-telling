// UserAdminService.java
package com.socialstory.service;

import com.socialstory.model.UserAdmin;
import com.socialstory.repository.UserAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserAdminRepository userAdminRepository;

    public boolean isUserAdmin(String email) {
        return userAdminRepository.existsByEmailAndAccountType(email, UserAdmin.AccountType.ADMIN);
    }

    public UserAdmin findByEmail(String email) {
        return userAdminRepository.findByEmail(email).orElse(null);
    }
}