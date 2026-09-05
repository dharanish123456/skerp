package com.skerp.skerp_backend.dto;

import com.skerp.skerp_backend.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceRequest(
    @NotNull Long employeeId,
    @NotNull LocalDate attendanceDate,
    LocalTime checkIn,
    LocalTime checkOut,
    @NotNull AttendanceStatus status,
    String notes
) {}
