package com.medifind.hospital.entity;

/**
 * Lifecycle status for a hospital profile.
 *
 * New self-registered hospitals start as PENDING and only become visible to
 * patients once an administrator approves them. Suspended hospitals disappear
 * from public listings and their owners cannot use the dashboard.
 */
public enum HospitalStatus {
    PENDING,
    APPROVED,
    REJECTED,
    ACTIVE,
    SUSPENDED
}
