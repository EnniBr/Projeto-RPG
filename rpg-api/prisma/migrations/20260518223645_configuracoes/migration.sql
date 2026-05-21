/*
  Warnings:

  - You are about to drop the column `jogadores_alterar_machucados` on the `Sessao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sessao" DROP COLUMN "jogadores_alterar_machucados",
ADD COLUMN     "jogadores_podem_alterar_machucados" BOOLEAN NOT NULL DEFAULT false;
