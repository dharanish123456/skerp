package com.skerp.skerp_backend.security;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PermissionAspectTests {

    static class ProtectedEndpoints {
        @RequirePermission({"VIEW_COMPANIES", "VIEW_EMPLOYEES"})
        public void companyLookup() {}
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allowsAccessWhenUserHasAnyRequiredPermission() throws Exception {
        setAuthorities("PERMISSION_VIEW_EMPLOYEES");
        JoinPoint joinPoint = joinPointFor("companyLookup");

        assertDoesNotThrow(() -> new PermissionAspect().checkPermission(joinPoint));
    }

    @Test
    void deniesAccessWhenUserHasNoRequiredPermission() throws Exception {
        setAuthorities("PERMISSION_VIEW_EXPENSES");
        JoinPoint joinPoint = joinPointFor("companyLookup");

        assertThrows(AccessDeniedException.class, () -> new PermissionAspect().checkPermission(joinPoint));
    }

    private void setAuthorities(String... authorities) {
        var grantedAuthorities = List.of(authorities).stream()
            .map(SimpleGrantedAuthority::new)
            .toList();
        var authentication = new UsernamePasswordAuthenticationToken("tester", null, grantedAuthorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private JoinPoint joinPointFor(String methodName) throws Exception {
        Method method = ProtectedEndpoints.class.getMethod(methodName);
        MethodSignature signature = mock(MethodSignature.class);
        when(signature.getMethod()).thenReturn(method);
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getSignature()).thenReturn(signature);
        return joinPoint;
    }
}
