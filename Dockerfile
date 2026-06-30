FROM node:24-alpine

WORKDIR /usr/src/app

# Habilitamos Corepack y usamos la misma versión de pnpm que el proyecto
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Copiamos únicamente los archivos necesarios para instalar dependencias
COPY package.json pnpm-lock.yaml ./

# Instalamos las dependencias
RUN pnpm install --frozen-lockfile

# Copiamos el resto del proyecto
COPY . .

# Generamos el cliente de Prisma
RUN pnpm exec prisma generate

# Compilamos la aplicación
RUN pnpm run build

EXPOSE 8080

CMD ["node", "dist/main.js"]
