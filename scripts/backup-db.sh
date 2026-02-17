#!/bin/bash

# Database Backup Script for Swan Swim Management
# This script creates a compressed PostgreSQL backup and manages retention

# Configuration
BACKUP_DIR="/Users/andyhu/swan-swim-management/backups"
LOG_FILE="$BACKUP_DIR/backup.log"
RETENTION_DAYS=30

# Database connection - reads from environment or uses default
# Use DIRECT_URL for pg_dump (not the pooled DATABASE_URL)
if [ -z "$DIRECT_URL" ]; then
    echo "ERROR: DIRECT_URL environment variable is not set" | tee -a "$LOG_FILE"
    echo "Please set DIRECT_URL or modify the script with your direct connection string" | tee -a "$LOG_FILE"
    echo "Note: pg_dump requires a direct connection, not a pooled connection" | tee -a "$LOG_FILE"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# Log start
echo "===========================================================" >> "$LOG_FILE"
echo "Backup started at $(date)" >> "$LOG_FILE"

# Extract database connection details from DIRECT_URL
# Format: postgresql://user:password@host:port/database
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
if [[ $DIRECT_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "ERROR: Could not parse DIRECT_URL" | tee -a "$LOG_FILE"
    exit 1
fi

# Perform backup using pg_dump
echo "Creating backup: $BACKUP_FILE" >> "$LOG_FILE"
export PGPASSWORD="$DB_PASS"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"; then
    echo "Backup created successfully" >> "$LOG_FILE"
    
    # Compress the backup
    echo "Compressing backup..." >> "$LOG_FILE"
    if gzip "$BACKUP_FILE"; then
        echo "Backup compressed: $COMPRESSED_FILE" >> "$LOG_FILE"
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo "Backup size: $BACKUP_SIZE" >> "$LOG_FILE"
    else
        echo "ERROR: Failed to compress backup" | tee -a "$LOG_FILE"
        exit 1
    fi
else
    echo "ERROR: Backup failed" | tee -a "$LOG_FILE"
    exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..." >> "$LOG_FILE"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "Deleted $DELETED_COUNT old backup(s)" >> "$LOG_FILE"

# Log completion
echo "Backup completed successfully at $(date)" >> "$LOG_FILE"
echo "===========================================================" >> "$LOG_FILE"

# Unset password
unset PGPASSWORD

exit 0
