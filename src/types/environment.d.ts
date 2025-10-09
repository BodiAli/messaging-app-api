declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    TEST_DATABASE_URL: string;
    SECRET_KEY: string;
  }
}
