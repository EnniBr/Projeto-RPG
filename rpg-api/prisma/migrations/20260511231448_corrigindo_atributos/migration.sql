/*
  Warnings:

  - You are about to drop the column `inteligencia` on the `Atributo` table. All the data in the column will be lost.
  - You are about to drop the column `prontidao` on the `Atributo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Atributo" DROP COLUMN "inteligencia",
DROP COLUMN "prontidao",
ADD COLUMN     "consciencia" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "intelecto" INTEGER NOT NULL DEFAULT 0;
