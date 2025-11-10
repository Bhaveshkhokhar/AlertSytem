package com.example.demo.controller;
import com.example.demo.services.RuleEngineService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/rules")
@CrossOrigin
@RequiredArgsConstructor
public class RulesController {
    private final RuleEngineService ruleEngine;

    @GetMapping
    public JsonNode getRules() { return ruleEngine.getAllFileRules(); }

    @PostMapping("/reload")
    public String reload() throws IOException {
        ruleEngine.reload();
        return "reloaded";
    }
}