package com.skerp.skerp_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be 100 characters or fewer")
        String fullName,
        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 100, message = "Email must be 100 characters or fewer")
        String email
) {}
