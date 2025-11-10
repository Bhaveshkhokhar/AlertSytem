package com.example.demo.controller;
import com.example.demo.dto.AlertRequest;
import com.example.demo.dto.DriverAlertStatsDTO;
import com.example.demo.model.Alert;
import com.example.demo.model.AlertTransition;
import com.example.demo.services.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins ="http://localhost:5173")
@RequestMapping("/api/alerts")
public class AlertController {
    @Autowired
    private  AlertService alertService;

    @PostMapping
    public Alert create(@RequestBody AlertRequest req) {
        return alertService.ingest(req);
    }

    @GetMapping
    public List<Alert> getTop20All() { return alertService.getTop20All(); }

    @GetMapping("/trends")
    public ResponseEntity<List<Map<String, Object>>> getAlertTrends() {
        return ResponseEntity.ok(alertService.getTrendData());
    }

    @GetMapping("/trends/weekly")
    public ResponseEntity<List<Map<String, Object>>> getAlertTrendsweekly() {
        return ResponseEntity.ok(alertService.getTrendDataweekly());
    }

    @GetMapping("/{alertId}")
    public Alert get(@PathVariable Integer  alertId) { return alertService.getByAlertId(alertId); }

    @PutMapping("/{alertId}/resolve")
    public String resolve(@PathVariable Integer  alertId) {
        alertService.resolve(alertId,"manual");
        return "success";
    }

    @GetMapping("/{alertId}/history")
    public List<AlertTransition> history(@PathVariable Integer  alertId) {
        return alertService.history(alertId);
    }
    @GetMapping("/auto-close")
    public List<Alert> autoClose(){
        return alertService.autoCloseAlert();

    }

}