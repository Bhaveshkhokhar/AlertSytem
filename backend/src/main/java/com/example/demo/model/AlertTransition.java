package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "alert_transitions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AlertTransition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "alert_id", nullable = false)
    private Integer alertId;
    @Column(name = "source_type", nullable = false)
    private String sourceType;
    private String type;
    private String fromStatus;
    private String toStatus;
    @Column(columnDefinition = "TEXT")
    private String metadata;
    private LocalDateTime timestamp = LocalDateTime.now();
    private LocalDateTime createdAt = LocalDateTime.now();
}