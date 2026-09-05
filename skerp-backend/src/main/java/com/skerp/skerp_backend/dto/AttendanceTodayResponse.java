package com.skerp.skerp_backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceTodayResponse(
    LocalDate attendanceDate,
    String state,
    LocalTime checkIn,
    LocalTime checkOut,
    String status,
    String message,
    String selfieUrl,
    Double latitude,
    Double longitude,
    String checkoutSelfieUrl,
    Double checkoutLatitude,
    Double checkoutLongitude
) {}
