package com.example.demo.dto;

import java.time.LocalDateTime;

public class DriverAlertStatsDTO {
    private String driverId;
    private String driverName;
    private Long totalOpen;
    private Long criticalCount;
    private Long warningCount;
    private Long infoCount;
    private LocalDateTime latestAlert;

    public DriverAlertStatsDTO(String driverId, String driverName, Long totalOpen,
                               Long criticalCount, Long warningCount, Long infoCount,
                               LocalDateTime latestAlert) {
        this.driverId = driverId;
        this.driverName = driverName;
        this.totalOpen = totalOpen;
        this.criticalCount = criticalCount;
        this.warningCount = warningCount;
        this.infoCount = infoCount;
        this.latestAlert = latestAlert;
    }


    public String getDriverId() { return driverId; }
    public String getDriverName() { return driverName; }
    public Long getTotalOpen() { return totalOpen; }
    public Long getCriticalCount() { return criticalCount; }
    public Long getWarningCount() { return warningCount; }
    public Long getInfoCount() { return infoCount; }
    public LocalDateTime getLatestAlert() { return latestAlert; }
}
