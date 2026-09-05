package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.dto.AttendanceRequest;
import com.skerp.skerp_backend.entity.AttendanceStatus;
import com.skerp.skerp_backend.entity.User;
import com.skerp.skerp_backend.security.RequirePermission;
import com.skerp.skerp_backend.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    @RequirePermission("VIEW_ATTENDANCE")
    public ResponseEntity<?> getAttendance(
        @RequestParam(required = false) Long employeeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) AttendanceStatus status
    ) {
        return execute(() -> attendanceService.getAttendance(employeeId, startDate, endDate, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("VIEW_ATTENDANCE")
    public ResponseEntity<?> getAttendanceById(@PathVariable Long id) {
        return execute(() -> attendanceService.getById(id));
    }

    @GetMapping("/summary")
    @RequirePermission("VIEW_ATTENDANCE")
    public ResponseEntity<?> getSummary(
        @RequestParam(required = false) Long employeeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) AttendanceStatus status
    ) {
        return execute(() -> attendanceService.getSummary(employeeId, startDate, endDate, status));
    }

    @PostMapping
    @RequirePermission("CREATE_ATTENDANCE")
    public ResponseEntity<?> create(@Valid @RequestBody AttendanceRequest request) {
        return execute(() -> attendanceService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("EDIT_ATTENDANCE")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody AttendanceRequest request) {
        return execute(() -> attendanceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("DELETE_ATTENDANCE")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return execute(() -> {
            attendanceService.delete(id);
            return Map.of("message", "Attendance deleted successfully");
        });
    }

    @GetMapping("/my/today")
    @RequirePermission("VIEW_OWN_ATTENDANCE")
    public ResponseEntity<?> getMyToday(@AuthenticationPrincipal User user) {
        return execute(() -> attendanceService.getToday(user));
    }

    @PostMapping("/my/check-in")
    @RequirePermission("MARK_OWN_ATTENDANCE")
    public ResponseEntity<?> checkIn(
        @AuthenticationPrincipal User user,
        @RequestParam(value = "selfie", required = false) MultipartFile selfie,
        @RequestParam(value = "latitude", required = false) Double latitude,
        @RequestParam(value = "longitude", required = false) Double longitude
    ) {
        return execute(() -> attendanceService.checkIn(user, selfie, latitude, longitude));
    }

    @PostMapping("/my/check-out")
    @RequirePermission("MARK_OWN_ATTENDANCE")
    public ResponseEntity<?> checkOut(
        @AuthenticationPrincipal User user,
        @RequestParam(value = "selfie", required = false) MultipartFile selfie,
        @RequestParam(value = "latitude", required = false) Double latitude,
        @RequestParam(value = "longitude", required = false) Double longitude
    ) {
        return execute(() -> attendanceService.checkOut(user, selfie, latitude, longitude));
    }

    private ResponseEntity<?> execute(Action action) {
        try {
            return ResponseEntity.ok(action.run());
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", exception.getMessage()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @FunctionalInterface
    private interface Action {
        Object run();
    }
}
