package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.dto.ChangePasswordRequest;
import com.skerp.skerp_backend.dto.ProfileResponse;
import com.skerp.skerp_backend.dto.UpdateProfileRequest;
import com.skerp.skerp_backend.entity.User;
import com.skerp.skerp_backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        return execute(() -> profileService.getProfile(currentUsername(authentication)));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        return execute(() -> profileService.updateProfile(currentUsername(authentication), request));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        try {
            profileService.changePassword(currentUsername(authentication), request);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    private String currentUsername(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return user.getUsername();
    }

    private ResponseEntity<?> execute(ProfileOperation operation) {
        try {
            return ResponseEntity.ok(operation.run());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @FunctionalInterface
    private interface ProfileOperation {
        ProfileResponse run();
    }
}
