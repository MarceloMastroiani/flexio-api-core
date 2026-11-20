import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Raíz del proyecto (con barra final)
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.module.ts',
            'src/main.ts',
            'src/**/*.dto.ts',
            'src/**/*.spec.ts',
            'src/**/*.type.ts',      // nuevo: report-response.type.ts
            'src/**/types/**',       // nuevo: carpeta reports/types
            'src/**/entities/**',
            'src/common/prisma/prisma.service.ts',
            'src/common/configs/**',
            'src/auth/strategies/**',
            'generated/**',
            'prisma/**',
      ],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {              // nuevo: piso mínimo
          lines: 45,
          functions: 30,
          branches: 45,
          statements: 45,
        },
    },
  },
  resolve: {
    alias: {
      // tsconfig: "paths": { "@/*": ["./*"] }
      '@/': root,
      // tsconfig: "baseUrl": "."  →  "generated/prisma/client"
      generated: `${root}generated`,
    },
  },
  plugins: [
    swc.vite({
      // Los tests corren en ESM dentro de Vitest
      module: { type: 'es6' },
      jsc: {
        parser: { syntax: 'typescript', decorators: true, dynamicImport: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        keepClassNames: true,
        loose: true,
      },
      // Evita que SWC lea un tsconfig que apunte a CommonJS
      tsconfigFile: false,
    }),
  ],
});
