/*
  Warnings:

  - You are about to drop the column `email_verificado` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `token_reset_expira` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `token_reset_senha` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `token_verificacao` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "email_verificado",
DROP COLUMN "token_reset_expira",
DROP COLUMN "token_reset_senha",
DROP COLUMN "token_verificacao";
