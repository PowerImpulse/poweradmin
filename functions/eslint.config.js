// functions/eslint.config.js

const globals = require("globals");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");
// const path = require("path");

// Necesario para que FlatCompat resuelva correctamente las configuraciones extendidas
const baseDirectory = __dirname;
const compat = new FlatCompat({
  baseDirectory: baseDirectory,
  resolvePluginsRelativeTo: baseDirectory,
});

module.exports = [
  // Ignorar carpetas comunes globalmente
  {
    ignores: ["node_modules/", ".firebase/", "dist/", "coverage/"],
  },

  // Aplicar reglas recomendadas de ESLint a todos los archivos .js
  js.configs.recommended,

  // Integrar eslint-config-google usando FlatCompat
  // Esto aplicará las reglas de Google.

  ...compat.extends("google"),

  // Configuración específica para tus archivos de funciones JavaScript
  {
    files: ["**/*.js"], // Aplica a todos los archivos .js en 'functions' y subdirectorios
    languageOptions: {
      ecmaVersion: 2022, // O "latest"
      sourceType: "commonjs", // Para Node.js y Cloud Functions (require/module.exports)
      globals: {
        ...globals.node, // Variables globales de Node.js (console, process, etc.)
        ...globals.es2021, // O la versión de ES que uses para globales como Promise
        // Añade más globales si los necesitas
      },
    },
    rules: {
      // Sobrescribe o ajusta reglas de 'eslint:recommended' y 'google' aquí
      // para que sean menos estrictas inicialmente o se adapten a tu estilo.

      // Reglas que tenías, ajustadas a 'warn' para no bloquear:
      "quotes": ["warn", "double"],
      "max-len": ["warn", {
        "code": 120, // Un poco más permisivo
        "ignoreUrls": true,
        "ignoreStrings": true,
        "ignoreTemplateLiterals": true,
        "ignoreRegExpLiterals": true,
        "ignoreComments": true,
      }],
      "indent": ["warn", 2, { "SwitchCase": 1 }],
      "object-curly-spacing": ["warn", "always"], // { key: value } es más común con Google Style
      "require-jsdoc": "off", // Desactivar si no usas JSDoc extensivamente
      "valid-jsdoc": "off", // Desactivar si no usas JSDoc
      "no-trailing-spaces": "warn",
      "comma-dangle": ["warn", "always-multiline"],
      "linebreak-style": "off", // Evitar problemas entre Windows/Unix

      // Reglas útiles adicionales o comunes para Cloud Functions
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off", // Permitir console.log (aunque logger es mejor para producción)
      "arrow-parens": ["warn", "as-needed"], // (arg) => ..., pero arg => ...
      "eol-last": ["warn", "always"], // Nueva línea al final del archivo
      "semi": ["warn", "always"], // Requerir punto y coma

      // Puedes añadir o modificar más reglas aquí.
      // Por ejemplo, si `eslint-config-google` es muy estricto con algo,
      // puedes ponerlo en "warn" o "off" aquí.
      // Ejemplo:
      // "camelcase": "warn",
    },
  },
];
