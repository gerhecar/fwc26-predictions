-- Migration: Add valid/deleted statuses and validation metadata to bet_submissions
ALTER TABLE bet_submissions
  MODIFY COLUMN status ENUM('submitted', 'valid', 'deleted') NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP NULL DEFAULT NULL AFTER status,
  ADD COLUMN IF NOT EXISTS validated_by VARCHAR(36) DEFAULT NULL AFTER validated_at;
