#!/bin/bash

# Script to check and fix file permissions for TehtavaApp
# Run as sudo or with appropriate permissions

# Configuration
APP_USER="www-data"  # The user running the web application
APP_GROUP="www-data"  # The group for the web application
WEB_ROOT="/var/www/production-api/TehtavaApp.API/wwwroot"
UPLOADS_DIR="$WEB_ROOT/uploads"

# ANSI colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TehtavaApp File Permissions Check and Repair Tool${NC}"
echo "---------------------------------------------"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Warning: Not running as root. Some operations may fail.${NC}"
  echo "Consider running with sudo for full functionality."
  echo ""
fi

# Check if webroot exists
if [ ! -d "$WEB_ROOT" ]; then
  echo -e "${RED}Error: Web root directory not found: $WEB_ROOT${NC}"
  echo "Please update the WEB_ROOT variable in this script."
  exit 1
fi

echo -e "${BLUE}Web root directory:${NC} $WEB_ROOT"

# Check uploads directory
if [ ! -d "$UPLOADS_DIR" ]; then
  echo -e "${YELLOW}Uploads directory does not exist. Creating it now...${NC}"
  mkdir -p "$UPLOADS_DIR"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Created uploads directory: $UPLOADS_DIR${NC}"
  else
    echo -e "${RED}Failed to create uploads directory!${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Uploads directory exists: $UPLOADS_DIR${NC}"
fi

# Create year and month directories for the current month
YEAR=$(date +"%Y")
MONTH=$(date +"%m")
YEAR_MONTH_DIR="$UPLOADS_DIR/$YEAR/$MONTH"

if [ ! -d "$YEAR_MONTH_DIR" ]; then
  echo -e "${YELLOW}Creating year/month directory: $YEAR_MONTH_DIR${NC}"
  mkdir -p "$YEAR_MONTH_DIR"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Created year/month directory: $YEAR_MONTH_DIR${NC}"
  else
    echo -e "${RED}Failed to create year/month directory!${NC}"
  fi
fi

# Fix permissions on web root
echo -e "${BLUE}Setting permissions on web root...${NC}"
chown -R $APP_USER:$APP_GROUP "$WEB_ROOT"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Set ownership of $WEB_ROOT to $APP_USER:$APP_GROUP${NC}"
else
  echo -e "${RED}Failed to set ownership on web root!${NC}"
fi

# Fix permissions on uploads directory and all subdirectories
echo -e "${BLUE}Setting permissions on uploads directory...${NC}"
chown -R $APP_USER:$APP_GROUP "$UPLOADS_DIR"
chmod -R 755 "$UPLOADS_DIR"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Set permissions on $UPLOADS_DIR${NC}"
else
  echo -e "${RED}Failed to set permissions on uploads directory!${NC}"
fi

# Check if files are readable by the web server
echo -e "${BLUE}Testing file access as web server user...${NC}"
if [ -f /usr/bin/sudo ]; then
  sudo -u $APP_USER test -r "$UPLOADS_DIR"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Web server user can read uploads directory${NC}"
  else
    echo -e "${RED}Web server user cannot read uploads directory!${NC}"
  fi
  
  sudo -u $APP_USER test -w "$UPLOADS_DIR"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Web server user can write to uploads directory${NC}"
  else
    echo -e "${RED}Web server user cannot write to uploads directory!${NC}"
  fi
else
  echo -e "${YELLOW}Sudo not available - skipping test as web server user${NC}"
fi

# Test file creation
echo -e "${BLUE}Testing file creation in uploads directory...${NC}"
TEST_FILE="$UPLOADS_DIR/permission_test_$(date +%s).txt"
echo "Test file" > "$TEST_FILE"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Successfully created test file: $TEST_FILE${NC}"
  rm "$TEST_FILE"
  echo -e "${GREEN}Successfully removed test file${NC}"
else
  echo -e "${RED}Failed to create test file!${NC}"
fi

echo ""
echo -e "${GREEN}Permission check and repair complete!${NC}"
echo "If you still experience file upload issues, please check the application logs."
echo ""

# List storage use
echo -e "${BLUE}Storage Usage:${NC}"
df -h | grep -E '^Filesystem|/$'
echo ""
echo -e "${BLUE}Uploads Directory Size:${NC}"
du -sh "$UPLOADS_DIR"

exit 0 