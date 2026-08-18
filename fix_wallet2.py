with open('src/backend/controllers/walletController.ts', 'r') as f:
    c = f.read()

c = c.replace(
"""const amountSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required")
});""",
"""const amountSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required")
});"""
)

# Let's insert the custom checks inside deposit and withdraw.
c = c.replace(
"""      const validatedData = amountSchema.parse(req.body);
      const transaction = await walletService.createDepositRequest(userId, validatedData.amount, validatedData.idempotencyKey);""",
"""      const validatedData = amountSchema.parse(req.body);
      if (Number(validatedData.amount) < 5) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Minimum deposit is 5 USD' } });
      }
      const transaction = await walletService.createDepositRequest(userId, validatedData.amount, validatedData.idempotencyKey);"""
)

c = c.replace(
"""      const validatedData = amountSchema.parse(req.body);
      const transaction = await walletService.createWithdrawalRequest(userId, validatedData.amount, validatedData.idempotencyKey);""",
"""      const validatedData = amountSchema.parse(req.body);
      if (Number(validatedData.amount) < 10) {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Minimum withdrawal is 10 USD' } });
      }
      const transaction = await walletService.createWithdrawalRequest(userId, validatedData.amount, validatedData.idempotencyKey);"""
)

with open('src/backend/controllers/walletController.ts', 'w') as f:
    f.write(c)
