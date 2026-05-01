#!/bin/bash

# Database Backup Script for Swan Swim Management
# This script creates a compressed PostgreSQL backup and manages retention

# Configuration
BACKUP_DIR="/Users/andyhu/swan-swim-management/backups"
LOG_FILE="$BACKUP_DIR/backup.log"
RETENTION_DAYS=7

# Load environment variables if not already present
if [ -z "$DIRECT_URL" ]; then
    if [ -f "/Users/andyhu/swan-swim-management/packages/db/.env" ]; then
        export $(grep -v '^#' /Users/andyhu/swan-swim-management/packages/db/.env | xargs)
    elif [ -f "./packages/db/.env" ]; then
        export $(grep -v '^#' ./packages/db/.env | xargs)
    fi
fi

if [ -z "$DIRECT_URL" ]; then
    echo "ERROR: DIRECT_URL environment variable is not set" | tee -a "$LOG_FILE"
    echo "Please set DIRECT_URL or ensure packages/db/.env exists" | tee -a "$LOG_FILE"
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

# Perform backup using pg_dump
echo "Creating backup: $BACKUP_FILE" >> "$LOG_FILE"

# Provide the connection URI directly (much safer than regex parsing)
if pg_dump "$DIRECT_URL" -F p -f "$BACKUP_FILE"; then
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

exit 0
