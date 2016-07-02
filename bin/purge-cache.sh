#!/bin/sh

CLOUDFLARE_DOMAIN="$1"

CLOUDFLARE_ZONE=`curl -X GET -H "X-Auth-Email: ${CLOUDFLARE_AUTH_EMAIL}" -H "X-Auth-Key: ${CLOUDFLARE_AUTH_KEY}" -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones?name=${CLOUDFLARE_DOMAIN}" | jq -r ".result[0].id"`

echo "Purging ${CLOUDFLARE_ZONE}"

curl -X DELETE -H "X-Auth-Email: ${CLOUDFLARE_AUTH_EMAIL}" -H "X-Auth-Key: ${CLOUDFLARE_AUTH_KEY}" -H "Content-Type: application/json" --data '{"purge_everything":true}' "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache"
