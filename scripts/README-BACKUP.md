# Database Backup Setup - README

## Overview

Automated PostgreSQL database backup system for Swan Swim Management. Backups run daily via cron and are automatically compressed and cleaned up after 30 days.

## Files Created

- **`scripts/backup-db.sh`** - Main backup script
- **`scripts/crontab-example.txt`** - Cron configuration examples
- **`backups/`** - Directory for storing backups
- **`backups/.gitignore`** - Excludes backup files from git

## Quick Start

### 1. Set Your Database URL

You need to provide your PostgreSQL connection string. Choose one method:

**Option A: Set environment variable (Recommended)**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export DATABASE_URL="postgresql://username:password@host:port/database"
```

**Option B: Provide in cron command**
```bash
# See crontab-example.txt for examples
```

### 2. Test the Backup Script

```bash
cd /Users/andyhu/swan-swim-management
DATABASE_URL="your_connection_string" ./scripts/backup-db.sh
```

Check that a backup file appears in `backups/` directory.

### 3. Install Cron Job

```bash
crontab -e
```

Add this line for daily backups at 2 AM:
```
0 2 * * * cd /Users/andyhu/swan-swim-management && DATABASE_URL="your_connection_string" ./scripts/backup-db.sh
```

See `scripts/crontab-example.txt` for more scheduling options.

### 4. Verify

```bash
# List your cron jobs
crontab -l

# Check backup logs (after first run)
cat backups/backup.log
```

## Backup Details

- **Format**: Compressed SQL dump (`.sql.gz`)
- **Naming**: `backup_YYYY-MM-DD_HH-MM-SS.sql.gz`
- **Retention**: 30 days (configurable in script)
- **Logs**: `backups/backup.log`

## Restoring from Backup

```bash
# Decompress
gunzip backups/backup_2026-02-14_02-00-00.sql.gz

# Restore
psql -h host -p port -U username -d database < backups/backup_2026-02-14_02-00-00.sql
```

## Customization

Edit `scripts/backup-db.sh` to change:
- `RETENTION_DAYS` - How long to keep backups (default: 30)
- `BACKUP_DIR` - Where to store backups

## Troubleshooting

**"pg_dump: command not found"**
- Install PostgreSQL client tools: `brew install postgresql`

**"ERROR: DATABASE_URL environment variable is not set"**
- Set DATABASE_URL as shown in step 1

**Cron job not running**
- Check cron is enabled: `sudo launchctl list | grep cron`
- Check system logs: `log show --predicate 'process == "cron"' --last 1h`
