package com.medifind.notification.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Plain servlet filter (no Spring Security dependency) that validates the
 * incoming Bearer JWT and exposes the authenticated user's id as the
 * {@code X-User-Id} request attribute — mirroring how the other MediFind
 * microservices resolve the current user.
 *
 * <p>Requests without a valid token simply continue without the attribute;
 * controllers fall back to their default user id.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter implements Filter {

    private final JwtService jwtService;

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            final String jwt = authHeader.substring(7);
            try {
                if (jwtService.isTokenValid(jwt)) {
                    Integer userIdObj = jwtService.extractClaim(jwt, claims -> claims.get("userId", Integer.class));
                    if (userIdObj != null) {
                        request.setAttribute("X-User-Id", userIdObj.longValue());
                    }
                }
            } catch (Exception e) {
                log.debug("JWT validation failed: {}", e.getMessage());
            }
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }
}
