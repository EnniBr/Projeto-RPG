/*
  Warnings:

  - You are about to drop the column `consequencia` on the `Poder` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Poder` table. All the data in the column will be lost.
  - Added the required column `custo_total` to the `Poder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `efeito_base` to the `Poder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `graduacoes` to the `Poder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Atributo" ADD COLUMN     "aparar" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "esquiva" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fortitude" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vontade" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Personagem" ADD COLUMN     "pontos_poder_gastos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Poder" DROP COLUMN "consequencia",
DROP COLUMN "descricao",
ADD COLUMN     "custo_total" INTEGER NOT NULL,
ADD COLUMN     "descritores" TEXT,
ADD COLUMN     "efeito_base" TEXT NOT NULL,
ADD COLUMN     "extras" TEXT,
ADD COLUMN     "falhas" TEXT,
ADD COLUMN     "graduacoes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "nivel_poder" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "PersonagemPericia" (
    "id" SERIAL NOT NULL,
    "graduacoes" INTEGER NOT NULL DEFAULT 0,
    "nome_pericia" TEXT NOT NULL,
    "personagem_id" INTEGER NOT NULL,

    CONSTRAINT "PersonagemPericia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonagemVantagem" (
    "id" SERIAL NOT NULL,
    "nome_vantagem" TEXT NOT NULL,
    "graduacoes" INTEGER NOT NULL DEFAULT 1,
    "personagem_id" INTEGER NOT NULL,

    CONSTRAINT "PersonagemVantagem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PersonagemPericia" ADD CONSTRAINT "PersonagemPericia_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "Personagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonagemVantagem" ADD CONSTRAINT "PersonagemVantagem_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "Personagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
