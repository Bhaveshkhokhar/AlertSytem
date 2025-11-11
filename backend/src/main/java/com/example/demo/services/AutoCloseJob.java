package com.example.demo.services;
import com.example.demo.model.Alert;
import com.example.demo.model.AlertTransition;
import com.example.demo.repo.AlertRepository;
import com.example.demo.repo.TransitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.List;
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoCloseJob {
    private final AlertRepository alertRepository;
    private final TransitionRepository transitionRepository;
    private final RuleEngineService ruleEngine;

    // runs every 2 minutes
    @Scheduled(fixedRate = 120000)
    @Transactional
    public void scan() {
        log.info("scanning for auto_close");
        List<Alert> alerts = alertRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Alert a : alerts) {
            try {
                // idempotent: check status and flags
                if ("AUTO-CLOSED".equals(a.getStatus()) || "RESOLVED".equals(a.getStatus())) continue;

                // Evaluate compliance auto-close rule
                JsonNode rule = ruleEngine.getRuleFor(a.getSourceType());
                Integer autoclosehr=1;
                if (rule != null && rule.has("auto_close_if")) {
                    autoclosehr = rule.path("auto_close_if").asInt();

                }

                // Example time-based auto-close: ESCALATED older than 1 hour -> AUTO-CLOSED
                if (a.getCreatedAt().isBefore(now.minusHours(1))) {
                    String prev = a.getStatus();
                    a.setStatus("AUTO-CLOSED");
                    a.setUpdatedAt(now);
                    alertRepository.save(a);
                    transitionRepository.save(AlertTransition.builder()
                            .alertId(a.getAlertId())
                                    .createdAt(a.getCreatedAt())
                                    .sourceType(a.getSourceType())
                            .fromStatus(prev)
                            .toStatus("AUTO-CLOSED")
                            .timestamp(now)
                            .build());
                }
            } catch (Exception ex) {
                // log and continue (fail-safe)
                ex.printStackTrace();
            }
        }
    }
}
