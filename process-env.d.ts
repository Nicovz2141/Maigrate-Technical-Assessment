declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

// Ensure this file is treated as a module
export {};
