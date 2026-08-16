package com.medifind.hospital.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * One-shot per-request filter that validates the Bearer JWT and
 * populates the {@link SecurityContextHolder} with the authenticated principal
 * and their roles — enabling {@code @PreAuthorize} checks downstream.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String username = jwtService.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt)) {
                    List<SimpleGrantedAuthority> authorities = jwtService.extractRoles(jwt)
                            .stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    // Expose the authenticated user id + role as request attributes so
                    // controllers can enforce ownership without re-parsing the token.
                    try {
                        Integer userIdObj = jwtService.extractClaim(jwt, claims -> claims.get("userId", Integer.class));
                        if (userIdObj != null) {
                            request.setAttribute("X-User-Id", userIdObj.longValue());
                        }
                        List<String> rolesClaim = jwtService.extractRoles(jwt);
                        String joined = String.join(",", rolesClaim == null ? List.of() : rolesClaim);
                        if (joined.contains("ADMIN")) request.setAttribute("X-User-Role", "ADMIN");
                        else if (joined.contains("HOSPITAL")) request.setAttribute("X-User-Role", "HOSPITAL");
                        else if (joined.contains("DOCTOR")) request.setAttribute("X-User-Role", "DOCTOR");
                        else if (joined.contains("PATIENT")) request.setAttribute("X-User-Role", "PATIENT");
                    } catch (Exception ex) {
                        log.debug("Could not extract user id from JWT: {}", ex.getMessage());
                    }

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("Authenticated user '{}' with roles {}", username, authorities);
                }
            }
            filterChain.doFilter(request, response);

        } catch (Exception ex) {
            log.error("JWT authentication error: {}", ex.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired JWT token");
        }
    }
}
