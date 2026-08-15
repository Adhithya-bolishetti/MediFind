package com.medifind.notification.client;

import com.medifind.notification.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Feign client for the user-service. Used to resolve recipient lists for
 * admin broadcasts. The role-scoped listing endpoint is intentionally not
 * admin-gated so inter-service calls need no extra token.
 */
@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/users/role/{role}")
    List<UserResponse> getUsersByRole(@PathVariable("role") String role);
}
