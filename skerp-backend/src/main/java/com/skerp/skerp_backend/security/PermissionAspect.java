package com.skerp.skerp_backend.security;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;

@Aspect
@Component
public class PermissionAspect {

    @Before("@annotation(com.skerp.skerp_backend.security.RequirePermission) || @within(com.skerp.skerp_backend.security.RequirePermission)")
    public void checkPermission(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        // 1. Check method level first
        RequirePermission requirePermission = method.getAnnotation(RequirePermission.class);
        
        // 2. If not on method, check class level
        if (requirePermission == null) {
            requirePermission = method.getDeclaringClass().getAnnotation(RequirePermission.class);
        }
        
        if (requirePermission != null) {
            String[] requiredPermissionNames = requirePermission.value();
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AccessDeniedException("User is not authenticated");
            }
            
            boolean hasPermission = authentication.getAuthorities().stream()
                .anyMatch(authority -> Arrays.stream(requiredPermissionNames)
                    .anyMatch(required -> authority.getAuthority().equals("PERMISSION_" + required)));
                
            if (!hasPermission) {
                throw new AccessDeniedException(
                    "Access denied. Requires one of: " + String.join(", ", requiredPermissionNames)
                );
            }
        }
    }
}
