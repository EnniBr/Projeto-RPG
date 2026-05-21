/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `Sessao` will be added. If there are existing duplicate values, this will fail.
  - The required column `codigo` was added to the `Sessao` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "codigo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_codigo_key" ON "Sessao"("codigo");
