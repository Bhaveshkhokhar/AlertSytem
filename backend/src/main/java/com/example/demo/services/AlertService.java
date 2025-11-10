package com.example.demo.services;
import com.example.demo.dto.AlertRequest;
import com.example.demo.dto.DriverAlertStatsDTO;
import com.example.demo.model.Alert;
import com.example.demo.model.AlertTransition;
import com.example.demo.repo.AlertRepository;
import com.example.demo.repo.TransitionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AlertService {
    @Autowired
    private  AlertRepository alertRepository;
    @Autowired
    private  TransitionRepository transitionRepository;
    @Autowired
    private  RuleEngineService ruleEngine;
    private  ObjectMapper mapper = new ObjectMapper();

    @Transactional
    public Alert ingest(AlertRequest req) {
        // Calculate 1 hour ago
        JsonNode rule = ruleEngine.getRuleFor(req.getSourceType());
        int autoCloseWindowHr = 1;

        if (rule.has("auto_close_window_hr")) {
            autoCloseWindowHr = rule.get("auto_close_window_hr").asInt();
        }
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(autoCloseWindowHr);
        // Try to find existing alert
        Optional<Alert> existingAlertOpt = alertRepository.findFirstBySourceTypeAndTypeAndDriverIdAndStatusNotInAndCreatedAtAfter(
                req.getSourceType(),
                req.getType(),
                req.getDriverId(),
                new String[]{"AUTO-CLOSED", "RESOLVED"},
                oneHourAgo
        );
        if (existingAlertOpt.isPresent()) {
            Alert alert = existingAlertOpt.get();
            String status="ESCALATED";
            String  severity="WARNING";
            int escalatecount = 1;
            if(rule.has("escalate_if_count")){
                escalatecount = rule.get("escalate_if_count").asInt();
            }
            if(alert.getEscalateCount()>=escalatecount){
                severity="CRITICAL";

            AlertTransition transition = new AlertTransition();
            transition.setAlertId(alert.getAlertId());
            transition.setSourceType(alert.getSourceType());
            transition.setType(alert.getType());
            transition.setFromStatus(alert.getStatus());
            transition.setToStatus(status); // if status unchanged
            transition.setMetadata(req.getMetadata());
            transition.setTimestamp(LocalDateTime.now());

            transitionRepository.save(transition);
            }

            // Update alert metadata and updatedAt
            alert.setStatus(status);
            alert.setEscalateCount(alert.getEscalateCount()+1);
            alert.setUpdatedAt(LocalDateTime.now());
            alert.setSeverity(severity);
            return alertRepository.save(alert);

        } else {
            // No existing alert → create new
            Alert alert = new Alert();
            alert.setSourceType(req.getSourceType());
            alert.setType(req.getType());
            alert.setDriverId(req.getDriverId());
            alert.setVehicleId(req.getVehicleId());
            alert.setMetadata(req.getMetadata());
            alert.setEscalateCount(1);
            alert.setStatus("OPEN") ;// default status
            alert.setSeverity("INFO") ;// default severity or compute from type
            alert.setCreatedAt(LocalDateTime.now());
            alert.setUpdatedAt(LocalDateTime.now());
            alert=alertRepository.save(alert);
            AlertTransition transition = new AlertTransition();
            transition.setAlertId(alert.getAlertId());
            transition.setSourceType(alert.getSourceType());
            transition.setType(alert.getType());
            transition.setFromStatus("NEW");
            transition.setToStatus("OPEN"); // if status unchanged
            transition.setMetadata(req.getMetadata());
            transition.setTimestamp(LocalDateTime.now());

            transitionRepository.save(transition);

            return alert;

        }
    }

    public List<Alert> getTop20All() { return alertRepository.findTop20ByOrderByCreatedAtDesc(); }

    public Alert getByAlertId(Integer  aid) { return alertRepository.findByAlertId(aid); }

    public List<DriverAlertStatsDTO> top5Drivers() { return alertRepository.findTopOffenders(); }

    @Transactional
    public ResponseEntity<String> resolve(Integer alertId, String actor) {
        Alert a = alertRepository.findByAlertId(alertId);
        if (a == null) throw new RuntimeException("Alert not found");
        if("AUTO-CLOSED".equals(a.getStatus()))return ResponseEntity.badRequest().body("Already Closed");
        if ("RESOLVED".equals(a.getStatus())) return ResponseEntity.ok("Success");
        String prev = a.getStatus();
        a.setStatus("RESOLVED");
        a.setUpdatedAt(LocalDateTime.now());
        alertRepository.save(a);
        transitionRepository.save(AlertTransition.builder()
                .alertId(alertId)
                .sourceType(a.getSourceType())
                .fromStatus(prev)
                .createdAt(a.getCreatedAt())
                .toStatus("RESOLVED")
                .metadata("MANUAL")
                .timestamp(LocalDateTime.now())
                .build());
        return ResponseEntity.ok("Success" );
    }

    public List<AlertTransition> history(Integer alertId) {
        return transitionRepository.findByAlertIdOrderByTimestampAsc(alertId);
    }

    public long countBySeverity(String severity) {
        return alertRepository.findAll().stream().filter(a -> severity.equalsIgnoreCase(a.getSeverity())).count();
    }

    public List<Map<String, Object>> getTrendData() {
        Map<String, Map<String, Object>> trendMap = new TreeMap<>();

        // 🟢 Step 1: Total alerts per day
        for (Object[] row : alertRepository.getTotalAlertsByDate()) {
            String date = row[0].toString();
            long totalAlerts = ((Number) row[1]).longValue();

            Map<String, Object> data = new HashMap<>();
            data.put("date", date);
            data.put("totalAlerts", totalAlerts);
            data.put("escalations", 0L);
            data.put("autoClosed", 0L);
            trendMap.put(date, data);
        }

        // 🔵 Step 2: Escalations & Auto-Closed per day
        for (Object[] row : transitionRepository.getEscalationsAndAutoClosedByDate()) {
            String date = row[0].toString();
            long escalations = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            long autoClosed = row[2] != null ? ((Number) row[2]).longValue() : 0L;

            trendMap.putIfAbsent(date, new HashMap<>());
            Map<String, Object> data = trendMap.get(date);
            data.put("date", date);
            data.putIfAbsent("totalAlerts", 0L);
            data.put("escalations", escalations);
            data.put("autoClosed", autoClosed);
        }

        // 🔸 Convert to list (sorted)
        return new ArrayList<>(trendMap.values());
    }

    public List<Map<String, Object>> getTrendDataweekly() {
        Map<String, Map<String, Object>> trendMap = new TreeMap<>();

        // Step 1: Total alerts per week (ISO week)
        List<Object[]> totalAlerts = alertRepository.getTotalAlertsByWeek();
        for (Object[] row : totalAlerts) {
            String week = row[0].toString(); // e.g., "2025-45"
            long total = ((Number) row[1]).longValue();

            Map<String, Object> data = new HashMap<>();
            data.put("week", week);
            data.put("totalAlerts", total);
            data.put("escalations", 0L);
            data.put("autoClosed", 0L);
            trendMap.put(week, data);
        }

        // Step 2: Escalations & Auto-Closed per week
        List<Object[]> transitions = transitionRepository.getEscalationsAndAutoClosedByWeek();
        for (Object[] row : transitions) {
            String week = row[0].toString();
            long escalations = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            long autoClosed = row[2] != null ? ((Number) row[2]).longValue() : 0L;

            trendMap.putIfAbsent(week, new HashMap<>());
            Map<String, Object> data = trendMap.get(week);
            data.put("week", week);
            data.putIfAbsent("totalAlerts", 0L);
            data.put("escalations", escalations);
            data.put("autoClosed", autoClosed);
        }

        // Convert map to sorted list
        return new ArrayList<>(trendMap.values());
    }

    public List<Alert> autoCloseAlert() {
        List<Alert> autoClosedAlerts = alertRepository.findByStatus("AUTO-CLOSED");
        return autoClosedAlerts;
    }
}