import fs from 'fs';

let content = fs.readFileSync('src/db/index.ts', 'utf-8');

const newGetTrap = `
    get(target, prop) {
      if (prop === 'query') {
        return async (...args: any[]) => {
          let retries = 3;
          let lastError: any = null;
          
          try {
            return await (realPool as any).query(...args);
          } catch (error: any) {
            lastError = error;
          }

          while (retries > 0) {
            if (lastError?.code === 'ECONNRESET' || lastError?.code === 'EPIPE' || lastError?.code === 'ETIMEDOUT' || lastError?.message?.includes('ECONNRESET')) {
              console.warn(\`[DB] Connection lost (CPU freeze). Retries left: \${retries}. Waiting 250ms...\`);
              try { await realPool?.end(); } catch (e) {}
              
              await new Promise(r => setTimeout(r, 250));
              
              realPool = createPool();
              try {
                return await (realPool as any).query(...args);
              } catch (retryError: any) {
                lastError = retryError;
                retries--;
              }
            } else {
              throw lastError;
            }
          }
          throw lastError;
        };
      }
      
      const value = (realPool as any)[prop];
      if (typeof value === 'function') {
        return value.bind(realPool);
      }
      return value;
    }
`;

content = content.replace(/get\(target, prop\) \{[\s\S]*?return value;\n    \}/, newGetTrap.trim());

fs.writeFileSync('src/db/index.ts', content);
