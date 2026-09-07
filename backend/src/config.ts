import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy backend/.env.example to backend/.env and fill it in.`,
    );
  }
  return value;
}

export const config = {
  groqApiKey: requireEnv('GROQ_API_KEY'),
  port: Number(process.env.PORT ?? 4000),
};
