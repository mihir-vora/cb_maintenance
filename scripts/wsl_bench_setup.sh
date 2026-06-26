#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
APP_SRC="/mnt/d/cb_maintenance"
BENCH_DIR="$HOME/frappe-bench"
SITE="cb-maintenance.localhost"
DB_ROOT_PASS="frappe"
ADMIN_PASS="admin123"
LOG="$HOME/bench-setup.log"

exec > >(tee -a "$LOG") 2>&1

echo "=== CB Maintenance bench setup started $(date) ==="

if ! command -v bench >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y \
    git python3-dev python3-pip python3-venv python3.12-venv \
    redis-server mariadb-server mariadb-client libmariadb-dev \
    pkg-config libffi-dev libssl-dev wkhtmltopdf xvfb \
    libjpeg-dev zlib1g-dev curl build-essential

  sudo service redis-server start || true
  sudo service mariadb start || true

  sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASS}'; FLUSH PRIVILEGES;" 2>/dev/null || \
    sudo mysql -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${DB_ROOT_PASS}'); FLUSH PRIVILEGES;" 2>/dev/null || true

  pip3 install frappe-bench --break-system-packages 2>/dev/null || pip3 install frappe-bench --user
  export PATH="$HOME/.local/bin:$PATH"
  grep -q '.local/bin' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

export PATH="$HOME/.local/bin:$PATH"

if [ ! -d "$BENCH_DIR" ]; then
  bench init "$BENCH_DIR" --frappe-branch version-15 --python python3.12 --ignore-exist
fi

cd "$BENCH_DIR"

if [ ! -d "apps/cb_maintenance" ]; then
  bench get-app "$APP_SRC"
fi

if ! bench --site "$SITE" list-apps >/dev/null 2>&1; then
  bench new-site "$SITE" \
    --mariadb-root-password "$DB_ROOT_PASS" \
    --admin-password "$ADMIN_PASS" \
    --no-mariadb-socket
fi

if ! bench --site "$SITE" list-apps 2>/dev/null | grep -q cb_maintenance; then
  bench --site "$SITE" install-app cb_maintenance
fi

bench use "$SITE"

grep -q "$SITE" /etc/hosts || echo "127.0.0.1 $SITE" | sudo tee -a /etc/hosts

echo "=== Setup complete $(date) ==="
echo "SITE=$SITE"
echo "ADMIN_PASS=$ADMIN_PASS"
bench --site "$SITE" list-apps
