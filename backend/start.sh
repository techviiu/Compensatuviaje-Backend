#!/bin/bash

set -e

echo " Generando Prisma Client..."
npx prisma generate

echo " Ejecutando migraciones..."
npx prisma migrate deploy

echo " Ejecutando seed..."
npm run prisma:seed

echo " Iniciando servidor..."
npm start
