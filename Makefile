# Phasepoint frontend
# - start-desktop: normal dev server in foreground (port from VITE_PORT in .env, default 3330)
# - start-dev / stop-dev: dev server in background (logs: _running/logs/dev.log, pid: _running/pids/dev.pid)
# - start-kiosk ID=<KIOSK_ID> / stop-kiosk: kiosk mode dev server in background (logs: _running/logs/kiosk.log, pid: _running/pids/kiosk.pid)

RUN_DIR := _running
LOGS_DIR := $(RUN_DIR)/logs
PIDS_DIR := $(RUN_DIR)/pids

.PHONY: start-desktop start-dev stop-dev start-kiosk stop-kiosk cleanup-ports

$(LOGS_DIR) $(PIDS_DIR):
	@mkdir -p $(LOGS_DIR) $(PIDS_DIR)

start-desktop:
	npm run dev

# Run dev server in background; stop with: make stop-dev
start-dev: $(LOGS_DIR) $(PIDS_DIR)
	@if [ -f $(PIDS_DIR)/dev.pid ] && kill -0 $$(cat $(PIDS_DIR)/dev.pid) 2>/dev/null; then \
		echo "Dev server already running (pid $$(cat $(PIDS_DIR)/dev.pid))"; \
		exit 0; \
	fi
	npm run dev >> $(LOGS_DIR)/dev.log 2>&1 & echo $$! > $(PIDS_DIR)/dev.pid
	@echo "Dev server started (pid $$(cat $(PIDS_DIR)/dev.pid), logs: $(LOGS_DIR)/dev.log)"

stop-dev:
	@if [ -f $(PIDS_DIR)/dev.pid ]; then \
		pid=$$(cat $(PIDS_DIR)/dev.pid); \
		if kill -0 $$pid 2>/dev/null; then kill $$pid; echo "Stopped dev server (pid $$pid)"; fi; \
		rm -f $(PIDS_DIR)/dev.pid; \
	else \
		echo "No dev server pid file. Stop with: pkill -f 'vite'"; \
	fi

# Run kiosk mode dev server in background; stop with: make stop-kiosk
# Pass kiosk UUID: make start-kiosk ID=550e8400-e29b-41d4-a716-446655440000
start-kiosk: $(LOGS_DIR) $(PIDS_DIR)
	@if [ -z "$(ID)" ]; then echo "Usage: make start-kiosk ID=<KIOSK_ID>"; exit 1; fi
	@KIOSK_PORT=$${KIOSK_PORT:-3331}; \
	if [ -f $(PIDS_DIR)/kiosk.pid ] && kill -0 $$(cat $(PIDS_DIR)/kiosk.pid) 2>/dev/null; then \
		echo "Kiosk dev server already running (pid $$(cat $(PIDS_DIR)/kiosk.pid))"; \
		exit 0; \
	fi; \
	VITE_KIOSK_ID=$(ID) npm run dev -- --port $$KIOSK_PORT >> $(LOGS_DIR)/kiosk.log 2>&1 & echo $$! > $(PIDS_DIR)/kiosk.pid; \
	echo "Kiosk dev server started on port $$KIOSK_PORT (pid $$(cat $(PIDS_DIR)/kiosk.pid), logs: $(LOGS_DIR)/kiosk.log)"

stop-kiosk:
	@KIOSK_PORT=$${KIOSK_PORT:-3331}; \
	if [ -f $(PIDS_DIR)/kiosk.pid ]; then \
		pid=$$(cat $(PIDS_DIR)/kiosk.pid); \
		if kill -0 $$pid 2>/dev/null; then kill $$pid; echo "Stopped kiosk dev server (pid $$pid)"; fi; \
		rm -f $(PIDS_DIR)/kiosk.pid; \
	fi; \
	# Also kill any vite processes using the kiosk port (in case pid file is stale) \
	pkill -f "vite.*--port $$KIOSK_PORT" 2>/dev/null && echo "Cleaned up stale vite processes on port $$KIOSK_PORT" || true

# Clean up any stale vite processes on common ports (3331-3335)
cleanup-ports:
	@echo "Cleaning up stale vite processes on ports 3331-3335..."
	@for port in 3331 3332 3333 3334 3335; do \
		pkill -f "vite.*--port $$port" 2>/dev/null && echo "  Killed process on port $$port" || true; \
	done
	@echo "Cleanup complete"
