#!/usr/bin/env sh
cd "$(dirname "$0")"
exec go run ./cmd/server
