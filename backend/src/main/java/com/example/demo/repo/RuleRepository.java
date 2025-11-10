package com.example.demo.repo;

import com.example.demo.model.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface RuleRepository extends JpaRepository<AlertRule, Long> {
    Optional<AlertRule> findByAlertType(String alertType);
}