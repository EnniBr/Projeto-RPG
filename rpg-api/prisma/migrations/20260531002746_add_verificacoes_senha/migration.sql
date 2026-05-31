/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "email_verificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "token_reset_expira" TIMESTAMP(3),
ADD COLUMN     "token_reset_senha" TEXT,
ADD COLUMN     "token_verificacao" TEXT,
ALTER COLUMN "senha" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_google_id_key" ON "Usuario"("google_id");
