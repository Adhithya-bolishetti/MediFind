package com.medifind.notification.dto;

import lombok.Data;

@Data
public class SendSmsRequest {
    private String phoneNumber;
    private String message;
}
