package com.example.demo.controller;
import com.example.demo.dto.DriverAlertStatsDTO;
import com.example.demo.dto.StatsDto;
import com.example.demo.services.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@Slf4j
@RestController
@CrossOrigin(origins ="http://localhost:5173")
@RequestMapping("api/dashboard")
public class DashboardController {
    @Autowired
    private  AlertService alertService;

    @GetMapping("/stats")
    public StatsDto stats() {
        log.info("getting stats data");
        long critical = alertService.countBySeverity("CRITICAL");
        long warning = alertService.countBySeverity("WARNING");
        long info = alertService.countBySeverity("INFO");
        return new StatsDto(critical, warning, info);
    }

    @GetMapping("/top")
    public ResponseEntity<List<DriverAlertStatsDTO>> getDriverAlertStats() {
        log.info("Searching for top offender");
        List<DriverAlertStatsDTO> stats = alertService.top5Drivers();
        return ResponseEntity.ok(stats);
    }

}