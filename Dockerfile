FROM node:24-alpine

WORKDIR /usr/src/app

# Habilitamos Corepack y usamos la misma versión de pnpm que el proyecto
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

# Copiamos únicamente los archivos necesarios para instalar dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalamos dependencias
RUN pnpm install --frozen-lockfile

# Copiamos el resto del proyecto
COPY . .

# Generamos el cliente de Prisma
RUN pnpm exec prisma generate

# Compilamos la aplicación
RUN pnpm run build

EXPOSE 8080

CMD ["node", "dist/main.js"]
