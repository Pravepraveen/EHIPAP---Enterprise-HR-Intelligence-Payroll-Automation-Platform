package com.ehipap.employee.controller;

import com.ehipap.employee.entity.Department;
import com.ehipap.employee.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentRepository.findByActive(true));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> get(@PathVariable UUID id) {
        return departmentRepository.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Department> create(@RequestBody Department dept) {
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentRepository.save(dept));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Department> update(@PathVariable UUID id, @RequestBody Department req) {
        return departmentRepository.findById(id).map(d -> {
            d.setName(req.getName()); d.setDescription(req.getDescription());
            d.setManagerId(req.getManagerId());
            return ResponseEntity.ok(departmentRepository.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }
}
