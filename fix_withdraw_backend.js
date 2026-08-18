import fs from 'fs';

let code = fs.readFileSync('src/backend/controllers/walletController.ts', 'utf8');

const oldWithdrawSchema = `const withdrawSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  paymentMethodId: z.string().optional(),
  withdrawalDetails: z.any().optional(),
});`;

const newWithdrawSchema = `const withdrawSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  paymentMethodId: z.string().optional(),
  paymentMethodName: z.string().optional(),
  paymentMethodType: z.string().optional(),
  withdrawalDetails: z.any().optional(),
});`;
code = code.replace(oldWithdrawSchema, newWithdrawSchema);

const oldCall = `const transaction = await walletService.createWithdrawalRequest(userId, validatedData.amount, validatedData.idempotencyKey, { withdrawalDetails: validatedData.withdrawalDetails });`;
const newCall = `const transaction = await walletService.createWithdrawalRequest(userId, validatedData.amount, validatedData.idempotencyKey, {
        paymentMethodId: validatedData.paymentMethodId,
        paymentMethodName: validatedData.paymentMethodName,
        paymentMethodType: validatedData.paymentMethodType,
        withdrawalDetails: validatedData.withdrawalDetails
      });`;
code = code.replace(oldCall, newCall);

fs.writeFileSync('src/backend/controllers/walletController.ts', code);
