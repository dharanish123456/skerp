package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) > 0 FROM User u JOIN u.roles r WHERE r.id = :roleId")
    boolean existsByRoleId(@org.springframework.data.repository.query.Param("roleId") Long roleId);
}

