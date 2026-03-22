module.exports = {
  apps: [{
    name: 'flowedu',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    cwd: '/var/www/flowedu',
    env: {
      DATABASE_URL: "mysql://3L6VQmCyn9cEeAf.root:Wwz5D3yH6WV1500C@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/flowedu",
      JWT_SECRET: "g2jRF9/Xxg6nkTACQDqZp7+8Ca1sC1tkrdunMiwOwNk=",
      NODE_ENV: "production",
      PORT: "3000",
      GEMINI_API_KEY: "AIzaSyCE7QWeJ-UhuD6FQXlTvi57bGeDtHYbXtk",
      VITE_APP_URL: "https://flowedu.app",
      VITE_APP_TITLE: "FlowEdu",
      OAUTH_SERVER_URL: "https://api.manus.im",
      VITE_OAUTH_PORTAL_URL: "https://id.manus.im",
      VITE_APP_ID: "flowedu",
      OWNER_OPEN_ID: "flowedu-owner",
      OWNER_NAME: "FlowEdu",
      BUILT_IN_FORGE_API_URL: "https://forge.manus.ai",
      BUILT_IN_FORGE_API_KEY: "NYSLt3Ah4xuzZ539HJXcgU",
      VITE_FRONTEND_FORGE_API_URL: "",
      VITE_FRONTEND_FORGE_API_KEY: "",
      GROQ_API_KEY: "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",
      VAPID_PUBLIC_KEY: "BN9JYhB4sCcxdcKSBuA0A_eZ1Pvfw8AO4ZezDtWzlSzO_hGgP3sZFXLEJWs1Lyi4fnSZAlGHNCSMdHZLgfLHJC4",
      VAPID_PRIVATE_KEY: "J72TlO66ZFO5hFj26aPJGGnhI-UsYU1MkPn-qXNF8Po"
    }
  }]
};
