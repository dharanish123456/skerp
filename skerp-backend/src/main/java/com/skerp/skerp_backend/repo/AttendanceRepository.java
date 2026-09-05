package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.Attendance;
import com.skerp.skerp_backend.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    @Query("""
        SELECT attendance FROM Attendance attendance
        JOIN FETCH attendance.employee employee
        WHERE (:employeeId IS NULL OR employee.id = :employeeId)
          AND (:startDate IS NULL OR attendance.attendanceDate >= :startDate)
          AND (:endDate IS NULL OR attendance.attendanceDate <= :endDate)
          AND (:status IS NULL OR attendance.status = :status)
        ORDER BY attendance.attendanceDate DESC, employee.name ASC
        """)
    List<Attendance> findFiltered(
        @Param("employeeId") Long employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("status") AttendanceStatus status
    );
}
