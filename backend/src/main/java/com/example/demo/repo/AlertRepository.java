package com.example.demo.repo;
import com.example.demo.dto.DriverAlertStatsDTO;
import com.example.demo.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    Alert findByAlertId(Integer alertId);

    List<Alert> findBySourceTypeAndDriverIdAndCreatedAtAfter(String sourceType, String driverId, LocalDateTime after);

    List<Alert> findByStatusNot(String status);

    public Optional<Alert> findFirstBySourceTypeAndTypeAndDriverIdAndStatusNotInAndCreatedAtAfter(
            String sourceType,
            String type,
            String driverId,
            String[] excludedStatuses,
            LocalDateTime CreatedAfter
    );
    @Query("""
        SELECT new com.example.demo.dto.DriverAlertStatsDTO(
            d.driverId,
            d.driverName,
            COUNT(a),
            SUM(CASE WHEN a.severity = 'CRITICAL' THEN 1 ELSE 0 END),
            SUM(CASE WHEN a.severity = 'WARNING' THEN 1 ELSE 0 END),
            SUM(CASE WHEN a.severity = 'INFO' THEN 1 ELSE 0 END),
            MAX(a.createdAt)
        )
        FROM Alert a
        JOIN Driver d ON a.driverId = d.driverId
        WHERE a.status <> 'RESOLVED' and a.status<>'AUTO-CLOSED'
        GROUP BY d.driverId, d.driverName
        ORDER BY COUNT(a) DESC
        limit 5
        """)
    List<DriverAlertStatsDTO> findTopOffenders();


    @Query(value = "SELECT * FROM alerts WHERE metadata->>'$.auto_closed_reason' IS NOT NULL ORDER BY resolved_at DESC LIMIT 50", nativeQuery = true)
    List<Alert> findRecentAutoClosed(); // optional native query (works in MySQL 5.7+ with JSON)

    List<Alert> findTop20ByOrderByCreatedAtDesc();

    @Query(value = """
        SELECT DATE(a.created_at) AS date, COUNT(a.alert_id) AS totalAlerts
        FROM alerts a
        WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(a.created_at)
        ORDER BY DATE(a.created_at)
    """, nativeQuery = true)
    List<Object[]> getTotalAlertsByDate();


    @Query(value = """
    SELECT DATE_FORMAT(created_at, '%x-%v') AS week, COUNT(alert_id) AS totalAlerts
    FROM alerts
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
    GROUP BY week
    ORDER BY week
""", nativeQuery = true)
    List<Object[]> getTotalAlertsByWeek();

    List<Alert> findByStatus(String status);

}