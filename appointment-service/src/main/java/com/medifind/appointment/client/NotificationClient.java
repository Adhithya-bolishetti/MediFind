package com.medifind.appointment.client;

import com.medifind.appointment.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "NOTIFICATION-SERVICE", path = "/api/notifications", configuration = FeignClientConfig.class)
public interface NotificationClient {

    @PostMapping
    void createNotification(@RequestBody Object notificationRequest, @RequestHeader(value = "Authorization", required = false) String token);

    @PostMapping("/email")
    void sendEmail(@RequestBody java.util.Map<String, Object> request, @RequestHeader(value = "Authorization", required = false) String token);

    @PostMapping("/sms")
    void sendSms(@RequestBody java.util.Map<String, Object> request, @RequestHeader(value = "Authorization", required = false) String token);
}
