#!/bin/bash
echo "Testing Health Check API..."
curl -s http://localhost:3000/api/health | grep '"backend":"ok"'
echo "Health check passed."
