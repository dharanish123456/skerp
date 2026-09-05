package com.skerp.skerp_backend.dto;

import com.skerp.skerp_backend.entity.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceResponse(
    Long id,
    Long employeeId,
    String employeeName,
    LocalDate attendanceDate,
    LocalTime checkIn,
    LocalTime checkOut,
    AttendanceStatus status,
    String notes,
    Long workedMinutes,
    String selfieUrl,
    Double latitude,
    Double longitude,
    String checkoutSelfieUrl,
    Double checkoutLatitude,
    Double checkoutLongitude
) {}
