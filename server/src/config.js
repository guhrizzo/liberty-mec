const isProd = process.env.NODE_ENV === 'production'

const jwtSecret = process.env.JWT_SECRET
if (isProd && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET é obrigatório em produção (mínimo de 32 caracteres).')
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 3001),
  // Em produção: DATABASE_URL da Render. Sem ela, usa um Postgres embutido (PGlite) para desenvolvimento.
  databaseUrl: process.env.DATABASE_URL || '',
  pgliteDir: process.env.PGLITE_DIR || './.data/pglite',
  jwtSecret: jwtSecret || 'dev-only-secret-troque-em-producao-0123456789',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  // Origens permitidas (separadas por vírgula). Ex.: https://liberty-mec.vercel.app
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5177')
    .split(',').map((s) => s.trim()).filter(Boolean),
}
