package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @ToString
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer alertId;
    @Column(name = "source_type", nullable = false)
    private String sourceType;
    private String severity;
    private String status;
    private String type;
    private Integer escalateCount;
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    @Column(name = "driver_id")
    private String driverId;
    @Column(name = "vehicle_id")
    private String vehicleId;
    @Column(columnDefinition = "TEXT")
    private String resolutionComment;
    @Column(columnDefinition = "TEXT")
    private String metadata;


}

