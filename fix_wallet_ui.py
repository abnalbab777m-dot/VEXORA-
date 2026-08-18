import re

with open('src/pages/Wallet.tsx', 'r') as f:
    c = f.read()

# Update validation in Wallet.tsx
c = c.replace(
    "if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {",
    "if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {"
)
# Actually, the logic there is:
c = re.sub(
    r"if \(!amount \|\| isNaN\(Number\(amount\)\) \|\| Number\(amount\) <= 0\) \{\s*setActionError\('Please enter a valid amount'\);\s*return;\s*\}",
    """if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setActionError('Please enter a valid amount');
      return;
    }
    if (type === 'deposit' && Number(amount) < 5) {
      setActionError('Minimum deposit is 5 USD');
      return;
    }
    if (type === 'withdraw' && Number(amount) < 10) {
      setActionError('Minimum withdrawal is 10 USD');
      return;
    }""",
    c
)

payment_info = """
            <div className="mb-4 bg-[#0A0F1C] p-4 rounded-lg border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm">Accepted Payment Methods:</h3>
              <div className="space-y-3 text-xs text-gray-300">
                <div className="p-3 bg-[#131A2A] rounded border border-white/5">
                  <p className="text-[#00D4FF] font-bold mb-1">البنك التركي</p>
                  <p>اسم صاحب الحساب: <span className="text-white select-all">RUBA ALİ AL HUSSEİN</span></p>
                  <p>IBAN: <span className="text-white font-mono select-all">TR77 0082 9000 0949 1962 5420 51</span></p>
                </div>
                <div className="p-3 bg-[#131A2A] rounded border border-white/5">
                  <p className="text-[#00D4FF] font-bold mb-1">شام كاش — USD</p>
                  <p>العنوان: <span className="text-white font-mono select-all">2f06deb324861ace61b595af570a7dfa</span></p>
                </div>
                <div className="p-3 bg-[#131A2A] rounded border border-white/5">
                  <p className="text-[#00D4FF] font-bold mb-1">USDT — BEP20</p>
                  <p>العنوان: <span className="text-white font-mono select-all">0x6b0dd72b14e64f75cf4355d1bca128f14c950647</span></p>
                </div>
                <div className="p-3 bg-[#131A2A] rounded border border-white/5">
                  <p className="text-[#00D4FF] font-bold mb-1">USDT — TRC20</p>
                  <p>العنوان: <span className="text-white font-mono select-all">TYXk6MdKCRNcj84sDtTVe1rwdqJStQWfVB</span></p>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2">After transferring the exact amount, please submit the request below.</p>
            </div>
"""

c = c.replace(
    '<p className="text-gray-400 text-sm mb-6">Note: Real payment gateways are not yet connected. This creates a pending deposit request.</p>',
    payment_info
)

c = c.replace(
    '<p className="text-gray-400 text-sm mb-6">Note: Real payout systems are not yet connected. This creates a pending withdrawal and locks your funds safely.</p>',
    '<p className="text-gray-400 text-sm mb-6">Withdrawal requests will be processed to your account. Minimum withdrawal is 10 USD.</p>'
)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(c)
