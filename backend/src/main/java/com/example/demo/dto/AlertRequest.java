package com.example.demo.dto;

import lombok.Data;

@Data
public class AlertRequest {
    private String sourceType;
    private String type;
    private String driverId;
    private String vehicleId;
    private String metadata; // JSON string or free text
}