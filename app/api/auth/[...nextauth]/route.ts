import { handlers } from '@/lib/auth';

// 显式声明使用 Node.js Runtime（局域网部署要求）
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
