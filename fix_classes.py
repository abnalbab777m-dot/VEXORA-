import re

def fix_file(filename):
    with open(filename, 'r') as f:
        c = f.read()

    # The method was injected like:
    # async func() { ... }
    # export const obj = new Class();
    
    # We want to move the method inside the closing } of the class.
    # The pattern is:
    # }
    # async func1() { ... }
    # export const obj
    
    # Let's do it properly using regex
    
    # Find the last closing brace before the export const
    # It might look like:
    # }
    # 
    # async approveTransaction
    
    # Actually, it's easier to just find "}\n  async approveTransaction"
    # and change it to "  async approveTransaction" then put "}" before "export const"
    
    c = c.replace("}\n  async approveTransaction", "  async approveTransaction")
    c = c.replace("}\n\n  async approveTransaction", "  async approveTransaction")
    
    # Same for adminController
    c = c.replace("}\n  async approveTransaction", "  async approveTransaction")
    c = c.replace("}\n\n  async approveTransaction", "  async approveTransaction")

    # If that replacement succeeded, we need to put a closing } before export const obj
    if "export const walletService" in c:
        c = c.replace("export const walletService", "}\nexport const walletService")
    
    if "export const adminController" in c:
        c = c.replace("export const adminController", "}\nexport const adminController")

    # Let's just fix it by looking at the exact text.
    with open(filename, 'w') as f:
        f.write(c)

# Actually, the replacement in patch_wallet.py was:
# c = c.replace("export const walletService = new WalletService();", admin_methods + "\nexport const walletService = new WalletService();")
# So `admin_methods` was placed RIGHT BEFORE `export const walletService`.
# Which means the class was already closed before `admin_methods`.
# Let's fix that!

with open('src/backend/services/walletService.ts', 'r') as f:
    c = f.read()
# Find the class closing brace.
c = re.sub(r'}\n+  async approveTransaction', r'  async approveTransaction', c)
c = c.replace("export const walletService = new WalletService();", "}\nexport const walletService = new WalletService();")
c = c.replace("}\n}\nexport const walletService = new WalletService();", "}\nexport const walletService = new WalletService();")

with open('src/backend/services/walletService.ts', 'w') as f:
    f.write(c)

with open('src/backend/controllers/adminController.ts', 'r') as f:
    c = f.read()
c = re.sub(r'}\n+  async approveTransaction', r'  async approveTransaction', c)
c = c.replace("export const adminController = new AdminController();", "}\nexport const adminController = new AdminController();")
c = c.replace("}\n}\nexport const adminController = new AdminController();", "}\nexport const adminController = new AdminController();")

with open('src/backend/controllers/adminController.ts', 'w') as f:
    f.write(c)

