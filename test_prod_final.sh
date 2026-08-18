echo "=== 1. DIAG (Revision & Container details) ==="
curl -s -i https://vexora-1.ai.studio/api/health/diag
echo -e "\n\n=== 2. DB DEBUG (Tests select from users) ==="
curl -s -i https://vexora-1.ai.studio/api/db-debug
echo -e "\n\n=== 3. LOGIN ==="
curl -s -i -X POST https://vexora-1.ai.studio/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"admin@vexora.com", "password":"password123"}'
echo -e "\n\n=== 4. REGISTER ==="
curl -s -i -X POST https://vexora-1.ai.studio/api/auth/register -H "Content-Type: application/json" -d '{"username":"ProdUserFinal", "email":"produserfinal@vexora.com", "password":"password123", "confirmPassword":"password123"}'
echo ""
