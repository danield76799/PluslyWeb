#!/bin/bash
# Plusly Web - Complete Install Script
# Run: wget -qO- https://raw.githubusercontent.com/danield76799/PluslyWeb/main/install.sh | sudo bash

set -e

echo "🚀 Plusly Web Installer"
echo "======================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Run als root: sudo ./install.sh"
    exit 1
fi

# Variables
WEB_ROOT="/var/www/chat.plusly.im"
NGINX_CONF="/etc/nginx/sites-available/chat.plusly.im"
GITHUB_RAW="https://raw.githubusercontent.com/danield76799/PluslyWeb/main/index.html"

echo "📁 Stap 1/6: Directory maken..."
mkdir -p "$WEB_ROOT"

echo "📥 Stap 2/6: Web client downloaden..."
if command -v wget &> /dev/null; then
    wget -q "$GITHUB_RAW" -O "$WEB_ROOT/index.html"
elif command -v curl &> /dev/null; then
    curl -sL "$GITHUB_RAW" -o "$WEB_ROOT/index.html"
else
    echo "❌ wget of curl nodig!"
    exit 1
fi

echo "🔐 Stap 3/6: Permissies zetten..."
if id "www-data" &>/dev/null; then
    chown -R www-data:www-data "$WEB_ROOT"
fi
chmod 755 "$WEB_ROOT"
chmod 644 "$WEB_ROOT/index.html"

echo "⚙️  Stap 4/6: Nginx configureren..."
cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name chat.plusly.im;
    root /var/www/chat.plusly.im;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

echo "🔗 Stap 5/6: Nginx site inschakelen..."
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/

# Remove default if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

echo "🔄 Stap 6/6: Nginx reloaden..."
if nginx -t; then
    systemctl reload nginx || service nginx reload || nginx -s reload
    echo ""
    echo "✅ SUCCES! Plusly Web is geïnstalleerd!"
    echo ""
    echo "🌐 Test het:"
    echo "   http://chat.plusly.im"
    echo "   http://$(hostname -I | awk '{print $1}')"
    echo ""
    echo "📋 Volgende stap: SSL certificaat"
    echo "   sudo certbot --nginx -d chat.plusly.im"
    echo ""
else
    echo "❌ Nginx config test mislukt!"
    exit 1
fi