/**
 * Configuración de ESLint (Flat Config) para analizar el código JavaScript
 * del Frontend Administrativo (static/admin/js) y del Frontend del Cliente (static/cliente/js).
 */
export default [
  {
    files: [
      "src/main/resources/static/admin/js/**/*.js",
      "src/main/resources/static/cliente/js/**/*.js"
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        console: "readonly",
        FormData: "readonly",
        File: "readonly",
        URLSearchParams: "readonly",
        encodeURIComponent: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": "warn",
      "curly": ["error", "all"],
      "no-console": "warn"
    }
  }
];
