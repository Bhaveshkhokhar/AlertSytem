package com.example.demo.repo;
import com.example.demo.model.AlertTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface TransitionRepository extends JpaRepository<AlertTransition, Long> {
    List<AlertTransition> findByAlertIdOrderByTimestampAsc(Integer alertId);

    @Query(value = """
        SELECT DATE(t.timestamp) AS date,
               SUM(CASE WHEN t.to_status = 'ESCALATED' THEN 1 ELSE 0 END) AS escalations,
               SUM(CASE WHEN t.to_status = 'AUTO-CLOSED' THEN 1 ELSE 0 END) AS autoClosed
        FROM alert_transitions t
        WHERE t.timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(t.timestamp)
        ORDER BY DATE(t.timestamp)
    """, nativeQuery = true)
    List<Object[]> getEscalationsAndAutoClosedByDate();

    @Query(value = """
    SELECT DATE_FORMAT(timestamp, '%x-%v') AS week,
           SUM(CASE WHEN to_status = 'ESCALATED' THEN 1 ELSE 0 END) AS escalations,
           SUM(CASE WHEN to_status = 'AUTO-CLOSED' THEN 1 ELSE 0 END) AS autoClosed
    FROM alert_transitions
    WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
    GROUP BY week
    ORDER BY week
""", nativeQuery = true)
    List<Object[]> getEscalationsAndAutoClosedByWeek();
}
