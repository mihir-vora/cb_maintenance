#!/bin/bash
set -euo pipefail

if [ "$(id -u)" = "0" ]; then
  apt-get update -y >/dev/null 2>&1 || true
  apt-get install -y redis-server mariadb-client >/dev/null 2>&1 || true
  mkdir -p /home/frappe/frappe-bench
  chown -R frappe:frappe /home/frappe
  exec gosu frappe bash "$0" "$@"
fi

SITE="cb-maintenance.localhost"
ADMIN_PASS="admin123"
DB_ROOT_PASS="frappe"
BENCH_DIR="/home/frappe/frappe-bench"
APPS_JSON="/home/frappe/apps.json"

export PATH="/home/frappe/.local/bin:$PATH"

wait_for_db() {
  for i in $(seq 1 60); do
    if mysqladmin ping -h mariadb -uroot -p"${DB_ROOT_PASS}" --silent 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  echo "MariaDB not ready"
  exit 1
}

if [ ! -d "$BENCH_DIR/apps/frappe" ]; then
  echo "Initializing bench..."
  wait_for_db
  bench init "$BENCH_DIR" \
    --frappe-branch version-15 \
    --python python3.11 \
    --ignore-exist \
    --skip-redis-config-generation \
    --skip-assets
  cd "$BENCH_DIR"
  bench set-config -g db_host mariadb
  bench set-config -g redis_cache "redis://redis:6379"
  bench set-config -g redis_queue "redis://redis:6379"
  bench set-config -g redis_socketio "redis://redis:6379"
else
  cd "$BENCH_DIR"
fi

if [ ! -d "$BENCH_DIR/apps/cb_maintenance" ]; then
  echo "Installing cb_maintenance app from workspace..."
  cp -a /workspace/cb_maintenance "$BENCH_DIR/apps/cb_maintenance"
  ./env/bin/pip install -e apps/cb_maintenance
  grep -qxF cb_maintenance sites/apps.txt 2>/dev/null || echo cb_maintenance >> sites/apps.txt
  bench build --app cb_maintenance
fi

if ! bench --site "$SITE" list-apps >/dev/null 2>&1; then
  echo "Creating site..."
  bench new-site "$SITE" \
    --db-host mariadb \
    --mariadb-root-password "$DB_ROOT_PASS" \
    --admin-password "$ADMIN_PASS" \
    --no-mariadb-socket
fi

if ! bench --site "$SITE" list-apps 2>/dev/null | grep -q cb_maintenance; then
  echo "Installing cb_maintenance..."
  bench --site "$SITE" install-app cb_maintenance
fi

bench --site "$SITE" set-config developer_mode 1
bench use "$SITE"

echo "Starting bench..."
exec bench start --host 0.0.0.0
