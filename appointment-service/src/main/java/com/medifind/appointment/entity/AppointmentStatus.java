package com.medifind.appointment.entity;

public enum AppointmentStatus {
    PENDING,
    CONFIRMED,
    DECLINED,
    CANCELLED,
    COMPLETED,
    REJECTED // Legacy value; treated the same as DECLINED
}
