package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.dto.ChangePasswordRequest;
import com.skerp.skerp_backend.dto.ProfileEmployeeSummary;
import com.skerp.skerp_backend.dto.ProfileResponse;
import com.skerp.skerp_backend.dto.UpdateProfileRequest;
import com.skerp.skerp_backend.entity.Employee;
import com.skerp.skerp_backend.entity.User;
import com.skerp.skerp_backend.repo.EmployeeRepository;
import com.skerp.skerp_backend.repo.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository, EmployeeRepository employeeRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ProfileResponse getProfile(String username) {
        return toResponse(findUser(username));
    }

    @Transactional
    public ProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = findUser(username);
        String fullName = request.fullName().trim();
        String email = request.email().trim().toLowerCase();
        if (fullName.isEmpty() || email.isEmpty()) {
            throw new IllegalArgumentException("Full name and email are required");
        }

        user.setFullName(fullName);
        user.setEmail(email);
        employeeRepository.findByUserId(user.getId()).ifPresent(employee -> {
            employee.setName(fullName);
            employee.setEmail(email);
            employeeRepository.save(employee);
        });
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = findUser(username);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private ProfileResponse toResponse(User user) {
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .sorted()
                .toList();
        List<String> permissions = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("PERMISSION_"))
                .map(authority -> authority.substring(11))
                .sorted()
                .toList();
        ProfileEmployeeSummary employee = employeeRepository.findByUserId(user.getId())
                .map(this::toEmployeeSummary)
                .orElse(null);
        return new ProfileResponse(
                user.getId(), user.getUsername(), user.getFullName(), user.getEmail(), user.isEnabled(),
                roles, permissions, user.getCreatedAt(), employee
        );
    }

    private ProfileEmployeeSummary toEmployeeSummary(Employee employee) {
        return new ProfileEmployeeSummary(
                employee.getId(),
                employee.getRole(),
                employee.getCompany() != null ? employee.getCompany().getName() : null,
                employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                employee.getJoined()
        );
    }
}
