package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.dto.AttendanceRequest;
import com.skerp.skerp_backend.entity.Attendance;
import com.skerp.skerp_backend.entity.AttendanceStatus;
import com.skerp.skerp_backend.entity.Employee;
import com.skerp.skerp_backend.entity.User;
import com.skerp.skerp_backend.repo.AttendanceRepository;
import com.skerp.skerp_backend.repo.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AttendanceServiceTests {

    private AttendanceRepository attendanceRepository;
    private EmployeeRepository employeeRepository;
    private AttendanceService service;
    private Employee employee;
    private User user;

    @BeforeEach
    void setUp() {
        attendanceRepository = mock(AttendanceRepository.class);
        employeeRepository = mock(EmployeeRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-07-20T18:31:15Z"), ZoneId.of("Asia/Kolkata"));
        service = new AttendanceService(attendanceRepository, employeeRepository, clock);
        employee = Employee.builder().id(10L).name("Test Employee").build();
        user = User.builder().id(5L).username("employee").password("password").build();
        when(employeeRepository.findByUserId(5L)).thenReturn(Optional.of(employee));
        when(attendanceRepository.saveAndFlush(any(Attendance.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void derivesAttendanceDayAndTimeFromIstClock() {
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(10L, LocalDate.of(2026, 7, 21)))
            .thenReturn(Optional.empty());

        var response = service.checkIn(user);

        assertEquals(LocalDate.of(2026, 7, 21), response.attendanceDate());
        assertEquals(LocalTime.of(0, 1, 15), response.checkIn());
        assertEquals("CHECKED_IN", response.state());
    }

    @Test
    void rejectsRepeatedCheckIn() {
        Attendance existing = Attendance.builder()
            .employee(employee).attendanceDate(LocalDate.of(2026, 7, 21))
            .status(AttendanceStatus.PRESENT).checkIn(LocalTime.of(0, 1)).build();
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(10L, LocalDate.of(2026, 7, 21)))
            .thenReturn(Optional.of(existing));

        var exception = assertThrows(IllegalStateException.class, () -> service.checkIn(user));
        assertEquals("You have already checked in today", exception.getMessage());
    }

    @Test
    void blocksSelfServiceWhenAdminMarkedAbsent() {
        Attendance existing = Attendance.builder()
            .employee(employee).attendanceDate(LocalDate.of(2026, 7, 21))
            .status(AttendanceStatus.ABSENT).build();
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(10L, LocalDate.of(2026, 7, 21)))
            .thenReturn(Optional.of(existing));

        var exception = assertThrows(IllegalStateException.class, () -> service.checkIn(user));
        assertEquals("Attendance is blocked. Please contact HR", exception.getMessage());
    }

    @Test
    void adminNonPresentStatusClearsTimes() {
        Attendance existing = Attendance.builder()
            .id(2L).employee(employee).attendanceDate(LocalDate.of(2026, 7, 20))
            .status(AttendanceStatus.PRESENT).checkIn(LocalTime.of(9, 0)).checkOut(LocalTime.of(17, 0)).build();
        when(attendanceRepository.findById(2L)).thenReturn(Optional.of(existing));
        when(employeeRepository.findById(10L)).thenReturn(Optional.of(employee));

        var response = service.update(2L, new AttendanceRequest(
            10L, LocalDate.of(2026, 7, 20), LocalTime.of(9, 0), LocalTime.of(17, 0),
            AttendanceStatus.ABSENT, "Admin correction"
        ));

        assertNull(response.checkIn());
        assertNull(response.checkOut());
        assertEquals(AttendanceStatus.ABSENT, response.status());
    }

    @Test
    void calculatesWorkedMinutesInResponse() {
        Attendance attendance = Attendance.builder()
            .id(3L).employee(employee).attendanceDate(LocalDate.of(2026, 7, 20))
            .status(AttendanceStatus.PRESENT).checkIn(LocalTime.of(9, 15)).checkOut(LocalTime.of(17, 45)).build();
        when(attendanceRepository.findFiltered(null, null, null, null)).thenReturn(List.of(attendance));

        var response = service.getAttendance(null, null, null, null).getFirst();

        assertEquals(510L, response.workedMinutes());
    }

    @Test
    void rejectsCheckoutWithoutCheckIn() {
        Attendance existing = Attendance.builder()
            .employee(employee).attendanceDate(LocalDate.of(2026, 7, 21))
            .status(AttendanceStatus.PRESENT).build();
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(10L, LocalDate.of(2026, 7, 21)))
            .thenReturn(Optional.of(existing));

        var exception = assertThrows(IllegalStateException.class, () -> service.checkOut(user));
        assertEquals("Please check in before checking out", exception.getMessage());
    }
}
