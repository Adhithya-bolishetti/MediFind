package com.medifind.notification.dto;

import lombok.Data;

@Data
public class SendEmailRequest {
    private String to;
    private String subject;
    private String body;
    private boolean isHtml;
}
