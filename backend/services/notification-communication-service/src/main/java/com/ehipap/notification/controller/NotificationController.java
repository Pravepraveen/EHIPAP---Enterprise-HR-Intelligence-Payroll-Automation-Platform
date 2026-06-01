package com.ehipap.notification.controller;

import com.ehipap.notification.entity.Notification;
import com.ehipap.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getAll(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam(required = false) Boolean unread) {
        if (userId == null) return ResponseEntity.ok(notificationRepository.findAll());
        UUID uid = UUID.fromString(userId);
        if (Boolean.TRUE.equals(unread))
            return ResponseEntity.ok(notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(uid, false));
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(uid));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.ok(Map.of("count", 0L));
        long count = notificationRepository.countByUserIdAndIsRead(UUID.fromString(userId), false);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping
    public ResponseEntity<Notification> create(@RequestBody Notification notification) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationRepository.save(notification));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable UUID id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            return ResponseEntity.ok(notificationRepository.save(n));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId != null) notificationRepository.markAllReadByUserId(UUID.fromString(userId));
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
