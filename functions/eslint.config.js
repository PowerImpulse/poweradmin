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


  ...compat.extends("google"),

  // Configuración específica para tus archivos de funciones JavaScript
  {
    files: ["**/*.js"], // Aplica a todos los archivos .js en 'functions' y subdirectorios
    languageOptions: {
      ecmaVersion: 2022, // O "latest"
      sourceType: "commonjs", // Para Node.js y Cloud Functions
      globals: {
        ...globals.node,
        ...globals.es2021,

      },
    },
    rules: {
      // Sobrescribe o ajusta reglas de 'eslint:recommended' y 'google'

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
      "object-curly-spacing": ["warn", "always"],
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


    },
  },
];
