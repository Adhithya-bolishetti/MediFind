package com.medifind.doctor.util;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Parsing helpers for doctor availability configuration.
 *
 * Working days are stored in several legacy/new formats and all must be
 * understood before computing slots:
 *   - "MONDAY,TUESDAY"          (full names, comma separated)
 *   - "Mon,Tue,Fri"             (abbreviations)
 *   - "Mon-Sat" / "MON-FRI"     (day ranges)
 *   - "Mon-Sat,MONDAY,FRIDAY"   (mixed)
 *
 * Times may be 24h ("09:00", "17:00") or 12h ("05:00 PM", "9:00AM").
 */
public final class AvailabilityUtils {

    private static final Map<String, Integer> DAY_INDEX = Map.of(
            "MON", 1, "TUE", 2, "WED", 3, "THU", 4, "FRI", 5, "SAT", 6, "SUN", 7
    );

    private static final DateTimeFormatter TIME_FORMATTER = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("[HH:mm][H:mm][h:mm a][hh:mm a][h:mma][hh:mma]")
            .toFormatter(Locale.ENGLISH);

    private AvailabilityUtils() {
    }

    /**
     * Returns the set of weekday indices (1=Monday .. 7=Sunday) the doctor works on.
     * An empty result means either nothing is configured or nothing was parseable —
     * callers decide how to interpret that (typically: no restriction).
     */
    public static Set<Integer> parseWorkingDays(String workingDays) {
        Set<Integer> days = new HashSet<>();
        if (workingDays == null || workingDays.trim().isEmpty()) {
            return days;
        }
        for (String token : workingDays.split(",")) {
            String t = token.trim().toUpperCase(Locale.ENGLISH);
            if (t.isEmpty()) {
                continue;
            }
            if (t.contains("-")) {
                String[] range = t.split("-", -1);
                if (range.length != 2) {
                    continue;
                }
                Integer start = dayIndex(range[0]);
                Integer end = dayIndex(range[1]);
                if (start == null || end == null) {
                    continue;
                }
                if (start <= end) {
                    for (int d = start; d <= end; d++) {
                        days.add(d);
                    }
                } else {
                    // Wrap-around range e.g. "Sun-Thu"
                    for (int d = start; d <= 7; d++) {
                        days.add(d);
                    }
                    for (int d = 1; d <= end; d++) {
                        days.add(d);
                    }
                }
            } else {
                Integer day = dayIndex(t);
                if (day != null) {
                    days.add(day);
                }
            }
        }
        return days;
    }

    public static boolean isWorkingDay(String workingDays, DayOfWeek day) {
        Set<Integer> days = parseWorkingDays(workingDays);
        if (days.isEmpty()) {
            // Nothing configured — treat as always available (legacy behavior).
            return true;
        }
        return days.contains(day.getValue());
    }

    /**
     * Parses a consultation time that may be 24h ("09:00", "17:00") or 12h
     * ("05:00 PM", "09:00AM"). Returns null when unparseable.
     */
    public static LocalTime parseTime(String time) {
        if (time == null || time.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalTime.parse(time.trim(), TIME_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Resolves a doctor's consultation start/end times, coping with legacy
     * 12-hour data that lost its AM/PM marker (e.g. end "05:00" meaning 5 PM).
     * When the end is not after the start and sits before noon, it is shifted
     * to the afternoon. Returns a two-element array [start, end]; either may be
     * null when unparseable.
     */
    public static LocalTime[] resolveConsultationHours(String startStr, String endStr) {
        LocalTime start = parseTime(startStr);
        LocalTime end = parseTime(endStr);
        if (start != null && end != null && !end.isAfter(start) && end.isBefore(LocalTime.NOON)) {
            end = end.plusHours(12);
        }
        return new LocalTime[]{start, end};
    }

    private static Integer dayIndex(String token) {
        String t = token.trim().toUpperCase(Locale.ENGLISH);
        if (t.length() > 3) {
            t = t.substring(0, 3);
        }
        return DAY_INDEX.get(t);
    }
}
