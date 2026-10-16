#!/usr/bin/env bash
set -euo pipefail

# Run this once on your Vultr VPS to prepare nginx and the web root.
#
# Usage (as root or with sudo):
#   export DEPLOY_PATH=/var/www/examschedule
#   bash setup-vultr.sh

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/examschedule}"

echo "==> Updating packages and installing nginx..."
apt-get update
apt-get install -y nginx rsync

echo "==> Creating web root at ${DEPLOY_PATH}..."
mkdir -p "${DEPLOY_PATH}"
chown -R www-data:www-data "${DEPLOY_PATH}"

echo "==> Writing nginx site config..."
cat > /etc/nginx/sites-available/examschedule <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name _;   # Accept any host, or change to your domain

    root ${DEPLOY_PATH};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets for 1 day
    location ~* \.(?:css|js|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|otf)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Do not cache JSON/text data files (they are rebuilt on each deploy)
    location ~* \.(?:json|txt|csv)$ {
        add_header Cache-Control "no-cache";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

if [ ! -e /etc/nginx/sites-enabled/examschedule ]; then
    ln -s /etc/nginx/sites-available/examschedule /etc/nginx/sites-enabled/examschedule
fi

# Remove the default site if it exists
rm -f /etc/nginx/sites-enabled/default

echo "==> Testing nginx config and starting..."
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "==> Server is ready."
echo "    Web root: ${DEPLOY_PATH}"
echo "    Next step: from your local machine run ./deploy.sh"
