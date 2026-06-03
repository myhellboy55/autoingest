#!/usr/bin/env bash
# Configures the Pi as a WiFi access point using NetworkManager (Pi OS Bookworm).
# Run once on the Pi: bash scripts/setup-ap.sh
# After this, the AP starts automatically on every boot.
set -euo pipefail

SSID="${AP_SSID:-PhotoIngest}"
PASSWORD="${AP_PASSWORD:-photoingest}"
IFACE="${AP_IFACE:-wlan0}"
AP_IP="10.42.0.1"
CON_NAME="photoingest-ap"

# ── Checks ────────────────────────────────────────────────────────────────────

if [[ $EUID -ne 0 ]]; then
    echo "Run as root: sudo bash scripts/setup-ap.sh"
    exit 1
fi

if ! command -v nmcli &>/dev/null; then
    echo "nmcli not found. Install NetworkManager: sudo apt install -y network-manager"
    exit 1
fi

if [[ ${#PASSWORD} -lt 8 ]]; then
    echo "AP_PASSWORD must be at least 8 characters."
    exit 1
fi

# ── Access point ──────────────────────────────────────────────────────────────

echo "Configuring WiFi access point..."
echo "  Interface : $IFACE"
echo "  SSID      : $SSID"
echo "  IP        : $AP_IP"
echo ""

# Remove any previous version of this connection
if nmcli con show "$CON_NAME" &>/dev/null; then
    nmcli con delete "$CON_NAME"
fi

# Create the AP profile.
# ipv4.method shared  → NetworkManager runs an internal DHCP server automatically;
#                        connected clients get addresses in 10.42.0.0/24.
# band bg / channel 6 → 2.4 GHz, compatible with all iPads and laptops.
nmcli con add \
    type wifi \
    ifname "$IFACE" \
    con-name "$CON_NAME" \
    autoconnect yes \
    ssid "$SSID" \
    mode ap \
    ipv4.method shared \
    ipv4.addresses "$AP_IP/24" \
    wifi-sec.key-mgmt wpa-psk \
    wifi-sec.psk "$PASSWORD" \
    802-11-wireless.band bg \
    802-11-wireless.channel 6

nmcli con up "$CON_NAME"

# ── Write .env ────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

cat > "$ENV_FILE" <<EOF
VITE_API_URL=http://${AP_IP}:5000/api
CORS_ORIGIN=http://${AP_IP}:5173
EOF

echo ""
echo "Done. Access point is running."
echo ""
echo "  Connect to WiFi : $SSID"
echo "  Password        : $PASSWORD"
echo "  Pi IP           : $AP_IP"
echo ""
echo ".env written with AP IP. Now rebuild and start Docker:"
echo ""
echo "  cd $PROJECT_ROOT"
echo "  docker compose up --build -d"
echo ""
echo "Then open http://$AP_IP:5173 on your iPad or laptop."
