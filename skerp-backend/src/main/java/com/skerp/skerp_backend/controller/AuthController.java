package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.dto.AuthResponse;
import com.skerp.skerp_backend.dto.LoginRequest;
import com.skerp.skerp_backend.dto.UserInfoResponse;
import com.skerp.skerp_backend.entity.User;
import com.skerp.skerp_backend.repo.UserRepository;
import com.skerp.skerp_backend.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshExpirationMs;

    @Autowired
    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserDetailsService userDetailsService,
            UserRepository userRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            User user = (User) authentication.getPrincipal();
            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            // Create refresh token cookie (secure=false for localhost dev)
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false) // Set to false for HTTP localhost
                    .path("/api/auth") // restrict path to auth endpoints
                    .maxAge(refreshExpirationMs / 1000)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            List<String> roles = user.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(auth -> auth.startsWith("ROLE_"))
                    .map(auth -> auth.substring(5))
                    .toList();

            List<String> permissions = user.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(auth -> auth.startsWith("PERMISSION_"))
                    .map(auth -> auth.substring(11))
                    .toList();

            AuthResponse authResponse = new AuthResponse(
                    accessToken,
                    user.getUsername(),
                    user.getFullName(),
                    roles,
                    permissions
            );

            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            refreshToken = Arrays.stream(request.getCookies())
                    .filter(cookie -> "refreshToken".equals(cookie.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "No refresh token cookie"));
        }

        try {
            String username = jwtService.extractUsername(refreshToken);
            if (username != null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (jwtService.isTokenValid(refreshToken, userDetails)) {
                    String newAccessToken = jwtService.generateAccessToken(userDetails);
                    String newRefreshToken = jwtService.generateRefreshToken(userDetails);

                    // Update the cookie
                    ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", newRefreshToken)
                            .httpOnly(true)
                            .secure(false)
                            .path("/api/auth")
                            .maxAge(refreshExpirationMs / 1000)
                            .sameSite("Lax")
                            .build();
                    response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

                    User user = (User) userDetails;
                    List<String> roles = user.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .filter(auth -> auth.startsWith("ROLE_"))
                            .map(auth -> auth.substring(5))
                            .toList();

                    List<String> permissions = user.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .filter(auth -> auth.startsWith("PERMISSION_"))
                            .map(auth -> auth.substring(11))
                            .toList();

                    return ResponseEntity.ok(new AuthResponse(
                            newAccessToken,
                            user.getUsername(),
                            user.getFullName(),
                            roles,
                            permissions
                    ));
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid refresh token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Token validation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth")
                .maxAge(0) // delete immediately
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() instanceof String) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        User user = (User) authentication.getPrincipal();
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5))
                .toList();

        List<String> permissions = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("PERMISSION_"))
                .map(auth -> auth.substring(11))
                .toList();

        UserInfoResponse userInfo = new UserInfoResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getCompanyId(),
                roles,
                permissions
        );

        return ResponseEntity.ok(userInfo);
    }
}
