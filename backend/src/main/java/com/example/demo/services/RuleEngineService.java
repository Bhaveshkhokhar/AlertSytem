package com.example.demo.services;

import com.example.demo.model.AlertRule;
import com.example.demo.repo.RuleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.util.Optional;

@Service
public class RuleEngineService {
    private final ObjectMapper mapper = new ObjectMapper();
    private JsonNode fileRules;

    private final RuleRepository ruleRepository;

    public RuleEngineService(RuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
        try { loadFromFile(); } catch (IOException e) { fileRules = mapper.createObjectNode(); }
    }

    public void loadFromFile() throws IOException {
        fileRules = mapper.readTree(new File("src/main/resources/rules.json"));
    }

    @Cacheable("rules")
    public JsonNode getRuleFor(String type) {
        // priority: DB rule if exists, else file rule
        Optional<AlertRule> db = ruleRepository.findByAlertType(type);
        if (db.isPresent()) {
            try {
                return mapper.readTree(db.get().getConditions());
            } catch (Exception e) { return mapper.createObjectNode(); }
        }
        return fileRules.path(type);
    }

    @CacheEvict(value = "rules", allEntries = true)
    public void reload() throws IOException {
        loadFromFile();
    }

    public JsonNode getAllFileRules() {
        return fileRules;
    }
}

