#!/bin/bash

# Script to install the database backup cron job

# Read DIRECT_URL from .env file (pg_dump needs direct connection, not pooled)
DB_URL=$(grep "^DIRECT_URL=" /Users/andyhu/swan-swim-management/packages/db/.env | cut -d '=' -f 2- | tr -d '"')

if [ -z "$DB_URL" ]; then
    echo "ERROR: Could not read DIRECT_URL from packages/db/.env"
    exit 1
fi

# Create the cron job line
CRON_LINE="0 2 * * * cd /Users/andyhu/swan-swim-management && DIRECT_URL=\"$DB_URL\" ./scripts/backup-db.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
    echo "Cron job already exists. Current crontab:"
    crontab -l | grep "backup-db.sh"
    echo ""
    read -p "Do you want to replace it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    # Remove existing backup cron job
    crontab -l | grep -v "backup-db.sh" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "Installed cron job:"
echo "$CRON_LINE"
echo ""
echo "This will run daily at 2:00 AM."
echo ""
echo "To verify, run: crontab -l"
echo "To test manually, run: cd /Users/andyhu/swan-swim-management && DIRECT_URL=\"\$DB_URL\" ./scripts/backup-db.sh"
