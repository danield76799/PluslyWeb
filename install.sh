#!/bin/bash
# Plusly Web Installer Script
# Run this on your Linux server

set -e

echo "🚀 Installing Plusly Web..."

# Download the web client
echo "📥 Downloading web client..."
wget -q https://raw.githubusercontent.com/danield76799/PluslyWeb/main/index.html -O /tmp/plusly-web.html

# Create directory
echo "📁 Creating directory..."
mkdir -p /var/www/chat.plusly.im

# Move file
echo "📄 Moving files..."
mv /tmp/plusly-web.html /var/www/chat.plusly.im/index.html

# Create nginx config
echo "⚙️  Configuring nginx..."
cat > /etc/nginx/sites-available/chat.plusly.im << 'EOF'
server {
    listen 80;
    server_name chat.plusly.im;
    root /var/www/chat.plusly.im;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/chat.plusly.im /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

echo "✅ Plusly Web installed!"
echo ""
echo "Next steps:"
echo "1. Configure DNS A record: chat.plusly.im -> 38.124.152.103"
echo "2. Get SSL certificate: certbot --nginx -d chat.plusly.im"
echo ""
echo "🌐 http://chat.plusly.im should work now!"