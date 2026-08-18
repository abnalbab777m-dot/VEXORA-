import fs from 'fs';

let code = fs.readFileSync('src/backend/controllers/walletController.ts', 'utf8');

const oldDepositSchema = `const depositSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  paymentMethodId: z.string().optional(),
});`;

const newDepositSchema = `const depositSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  paymentMethodId: z.string().optional(),
  senderName: z.string().optional(),
  transactionHash: z.string().optional(),
});`;

const oldWithdrawSchema = `const withdrawSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  withdrawalDetails: z.string().optional(),
});`;

const newWithdrawSchema = `const withdrawSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  paymentMethodId: z.string().optional(),
  withdrawalDetails: z.any().optional(),
});`;

code = code.replace(oldDepositSchema, newDepositSchema);
code = code.replace(oldWithdrawSchema, newWithdrawSchema);

const oldDepositCall = `const transaction = await walletService.createDepositRequest(userId, validatedData.amount, validatedData.idempotencyKey, { paymentMethodId: validatedData.paymentMethodId });`;
const newDepositCall = `const transaction = await walletService.createDepositRequest(userId, validatedData.amount, validatedData.idempotencyKey, { 
        paymentMethodId: validatedData.paymentMethodId,
        senderName: validatedData.senderName,
        transactionHash: validatedData.transactionHash
      });`;

code = code.replace(oldDepositCall, newDepositCall);

const oldWithdrawCall = `const transaction = await walletService.createWithdrawalRequest(userId, validatedData.amount, validatedData.idempotencyKey, validatedData.withdrawalDetails);`;
const newWithdrawCall = `const transaction = await walletService.createWithdrawalRequest(userId, validatedData.amount, validatedData.idempotencyKey, {
        paymentMethodId: validatedData.paymentMethodId,
        withdrawalDetails: validatedData.withdrawalDetails
      });`;

code = code.replace(oldWithdrawCall, newWithdrawCall);

fs.writeFileSync('src/backend/controllers/walletController.ts', code);
