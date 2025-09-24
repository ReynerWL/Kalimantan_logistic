export const config = {
  baseUrl: (typeof window !== 'undefined' ? (window as any).serverEnv?.DYNAMIC_ENV_BASE_URL : '') || process.env.NEXT_PUBLIC_BASE_URL || 'https://logistics-be.k3s.bangun-kreatif.com'
  // baseUrl: (typeof window !== 'undefined' ? (window as any).serverEnv?.DYNAMIC_ENV_BASE_URL : '') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3222'
};
