package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.dto.AttendanceRequest;
import com.skerp.skerp_backend.dto.AttendanceResponse;
import com.skerp.skerp_backend.dto.AttendanceTodayResponse;
import com.skerp.skerp_backend.entity.Attendance;
import com.skerp.skerp_backend.entity.AttendanceStatus;
import com.skerp.skerp_backend.entity.Employee;
import com.skerp.skerp_backend.entity.User;
import com.skerp.skerp_backend.repo.AttendanceRepository;
import com.skerp.skerp_backend.repo.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final Clock attendanceClock;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EmployeeRepository employeeRepository,
                             Clock attendanceClock) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceClock = attendanceClock;
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendance(Long employeeId, LocalDate startDate,
                                                   LocalDate endDate, AttendanceStatus status) {
        validateDateRange(startDate, endDate);
        return attendanceRepository.findFiltered(employeeId, startDate, endDate, status)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getById(Long id) {
        return toResponse(findAttendance(id));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getSummary(Long employeeId, LocalDate startDate,
                                        LocalDate endDate, AttendanceStatus status) {
        validateDateRange(startDate, endDate);
        List<Attendance> records = attendanceRepository.findFiltered(employeeId, startDate, endDate, status);
        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("totalRecords", (long) records.size());
        summary.put("present", records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count());
        summary.put("absent", records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count());
        summary.put("halfDay", records.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count());
        summary.put("completedCheckOuts", records.stream().filter(a -> a.getCheckOut() != null).count());
        return summary;
    }

    @Transactional
    public AttendanceResponse create(AttendanceRequest request) {
        if (attendanceRepository.findByEmployeeIdAndAttendanceDate(request.employeeId(), request.attendanceDate()).isPresent()) {
            throw new IllegalStateException("Attendance already exists for this employee and date");
        }
        Employee employee = employeeRepository.findById(request.employeeId())
            .orElseThrow(() -> new NoSuchElementException("Employee not found"));
        Attendance attendance = Attendance.builder()
            .employee(employee)
            .attendanceDate(request.attendanceDate())
            .build();
        applyAdminValues(attendance, request);
        return save(attendance, "Attendance already exists for this employee and date");
    }

    @Transactional
    public AttendanceResponse update(Long id, AttendanceRequest request) {
        Attendance attendance = findAttendance(id);
        if (!attendance.getEmployee().getId().equals(request.employeeId()) ||
            !attendance.getAttendanceDate().equals(request.attendanceDate())) {
            attendanceRepository.findByEmployeeIdAndAttendanceDate(request.employeeId(), request.attendanceDate())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new IllegalStateException("Attendance already exists for this employee and date"); });
        }
        Employee employee = employeeRepository.findById(request.employeeId())
            .orElseThrow(() -> new NoSuchElementException("Employee not found"));
        attendance.setEmployee(employee);
        attendance.setAttendanceDate(request.attendanceDate());
        applyAdminValues(attendance, request);
        return save(attendance, "Attendance already exists for this employee and date");
    }

    @Transactional
    public void delete(Long id) {
        attendanceRepository.delete(findAttendance(id));
    }

    @Value("${app.upload.dir:uploads/employee-proofs}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public AttendanceTodayResponse getToday(User user) {
        Employee employee = resolveEmployee(user);
        LocalDate today = LocalDate.now(attendanceClock);
        return attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
            .map(this::toTodayResponse)
            .orElse(new AttendanceTodayResponse(today, "NOT_CHECKED_IN", null, null, null,
                "Tap the button to check in", null, null, null, null, null, null));
    }

    @Transactional
    public AttendanceTodayResponse checkIn(User user) {
        return checkIn(user, null, null, null);
    }

    @Transactional
    public AttendanceTodayResponse checkIn(User user, MultipartFile selfie, Double latitude, Double longitude) {
        Employee employee = resolveEmployee(user);
        LocalDate today = LocalDate.now(attendanceClock);
        LocalTime now = LocalTime.now(attendanceClock).truncatedTo(ChronoUnit.SECONDS);
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
            .orElse(null);

        String selfieFilename = null;
        if (selfie != null && !selfie.isEmpty()) {
            try {
                selfieFilename = saveSelfieFile(selfie, employee.getId());
            } catch (IOException e) {
                throw new IllegalStateException("Failed to upload selfie photo", e);
            }
        }

        if (attendance == null) {
            attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(today)
                .checkIn(now)
                .status(AttendanceStatus.PRESENT)
                .selfiePath(selfieFilename)
                .latitude(latitude)
                .longitude(longitude)
                .build();
        } else {
            if (attendance.getStatus() != AttendanceStatus.PRESENT) {
                throw new IllegalStateException("Attendance is blocked. Please contact HR");
            }
            if (attendance.getCheckIn() != null) {
                throw new IllegalStateException("You have already checked in today");
            }
            attendance.setCheckIn(now);
            if (selfieFilename != null) attendance.setSelfiePath(selfieFilename);
            if (latitude != null) attendance.setLatitude(latitude);
            if (longitude != null) attendance.setLongitude(longitude);
        }
        save(attendance, "You have already checked in today");
        return toTodayResponse(attendance);
    }

    private String saveSelfieFile(MultipartFile file, Long employeeId) throws IOException {
        Path dir = Paths.get(uploadDir).getParent().resolve("selfies");
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String storedName = "selfie_emp" + employeeId + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        Path target = dir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return storedName;
    }

    @Transactional
    public AttendanceTodayResponse checkOut(User user) {
        return checkOut(user, null, null, null);
    }

    @Transactional
    public AttendanceTodayResponse checkOut(User user, MultipartFile selfie, Double latitude, Double longitude) {
        Employee employee = resolveEmployee(user);
        LocalDate today = LocalDate.now(attendanceClock);
        LocalTime now = LocalTime.now(attendanceClock).truncatedTo(ChronoUnit.SECONDS);
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
            .orElseThrow(() -> new IllegalStateException("Please check in before checking out"));
        if (attendance.getStatus() != AttendanceStatus.PRESENT) {
            throw new IllegalStateException("Attendance is blocked. Please contact HR");
        }
        if (attendance.getCheckIn() == null) {
            throw new IllegalStateException("Please check in before checking out");
        }
        if (attendance.getCheckOut() != null) {
            throw new IllegalStateException("You have already checked out today");
        }
        if (!now.isAfter(attendance.getCheckIn())) {
            throw new IllegalStateException("Check-out time must be after check-in time");
        }

        String selfieFilename = null;
        if (selfie != null && !selfie.isEmpty()) {
            try {
                selfieFilename = saveSelfieFile(selfie, employee.getId());
            } catch (IOException e) {
                throw new IllegalStateException("Failed to upload check-out selfie photo", e);
            }
        }

        attendance.setCheckOut(now);
        if (selfieFilename != null) attendance.setCheckoutSelfiePath(selfieFilename);
        if (latitude != null) attendance.setCheckoutLatitude(latitude);
        if (longitude != null) attendance.setCheckoutLongitude(longitude);

        attendanceRepository.saveAndFlush(attendance);
        return toTodayResponse(attendance);
    }

    private void applyAdminValues(Attendance attendance, AttendanceRequest request) {
        attendance.setStatus(request.status());
        attendance.setNotes(normalizeNotes(request.notes()));
        if (request.status() != AttendanceStatus.PRESENT) {
            attendance.setCheckIn(null);
            attendance.setCheckOut(null);
            return;
        }
        validateTimes(request.checkIn(), request.checkOut());
        attendance.setCheckIn(request.checkIn());
        attendance.setCheckOut(request.checkOut());
    }

    private void validateTimes(LocalTime checkIn, LocalTime checkOut) {
        if (checkOut != null && checkIn == null) {
            throw new IllegalArgumentException("Check-in time is required when check-out time is provided");
        }
        if (checkIn != null && checkOut != null && !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out time must be after check-in time");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }
    }

    private Employee resolveEmployee(User user) {
        if (user == null) throw new IllegalStateException("Authenticated user is unavailable");
        return employeeRepository.findByUserId(user.getId())
            .orElseThrow(() -> new IllegalStateException("No employee profile linked to this user account"));
    }

    private Attendance findAttendance(Long id) {
        return attendanceRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Attendance record not found"));
    }

    private AttendanceResponse save(Attendance attendance, String conflictMessage) {
        try {
            return toResponse(attendanceRepository.saveAndFlush(attendance));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException(conflictMessage);
        }
    }

    private String buildSelfieUrl(String selfiePath) {
        if (selfiePath == null || selfiePath.isBlank()) return null;
        if (selfiePath.startsWith("http://") || selfiePath.startsWith("https://")) return selfiePath;
        return "/uploads/selfies/" + selfiePath;
    }

    private AttendanceResponse toResponse(Attendance attendance) {
        Long workedMinutes = attendance.getCheckIn() != null && attendance.getCheckOut() != null
            ? Duration.between(attendance.getCheckIn(), attendance.getCheckOut()).toMinutes()
            : null;
        return new AttendanceResponse(
            attendance.getId(), attendance.getEmployee().getId(), attendance.getEmployee().getName(),
            attendance.getAttendanceDate(), attendance.getCheckIn(), attendance.getCheckOut(),
            attendance.getStatus(), attendance.getNotes(), workedMinutes,
            buildSelfieUrl(attendance.getSelfiePath()), attendance.getLatitude(), attendance.getLongitude(),
            buildSelfieUrl(attendance.getCheckoutSelfiePath()), attendance.getCheckoutLatitude(), attendance.getCheckoutLongitude()
        );
    }

    private AttendanceTodayResponse toTodayResponse(Attendance attendance) {
        String state;
        String message;
        if (attendance.getStatus() != AttendanceStatus.PRESENT) {
            state = "BLOCKED";
            message = "Attendance is blocked. Please contact HR";
        } else if (attendance.getCheckIn() == null) {
            state = "NOT_CHECKED_IN";
            message = "Tap the button to check in";
        } else if (attendance.getCheckOut() == null) {
            state = "CHECKED_IN";
            message = "You are checked in";
        } else {
            state = "COMPLETED";
            message = "Attendance completed for today";
        }
        return new AttendanceTodayResponse(
            attendance.getAttendanceDate(), state, attendance.getCheckIn(),
            attendance.getCheckOut(), attendance.getStatus().name(), message,
            buildSelfieUrl(attendance.getSelfiePath()), attendance.getLatitude(), attendance.getLongitude(),
            buildSelfieUrl(attendance.getCheckoutSelfiePath()), attendance.getCheckoutLatitude(), attendance.getCheckoutLongitude()
        );
    }

    private String normalizeNotes(String notes) {
        if (notes == null || notes.isBlank()) return null;
        return notes.trim();
    }
}
