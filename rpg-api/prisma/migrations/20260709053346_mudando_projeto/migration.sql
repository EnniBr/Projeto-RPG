/*
  Warnings:

  - You are about to drop the column `pontos_poder_gastos` on the `Personagem` table. All the data in the column will be lost.
  - You are about to drop the `Atributo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonagemComplicacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonagemPericia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonagemPoder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonagemVantagem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Poder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Atributo" DROP CONSTRAINT "Atributo_personagem_id_fkey";

-- DropForeignKey
ALTER TABLE "PersonagemComplicacao" DROP CONSTRAINT "PersonagemComplicacao_personagem_id_fkey";

-- DropForeignKey
ALTER TABLE "PersonagemPericia" DROP CONSTRAINT "PersonagemPericia_personagem_id_fkey";

-- DropForeignKey
ALTER TABLE "PersonagemPoder" DROP CONSTRAINT "PersonagemPoder_personagem_id_fkey";

-- DropForeignKey
ALTER TABLE "PersonagemPoder" DROP CONSTRAINT "PersonagemPoder_poder_id_fkey";

-- DropForeignKey
ALTER TABLE "PersonagemVantagem" DROP CONSTRAINT "PersonagemVantagem_personagem_id_fkey";

-- DropForeignKey
ALTER TABLE "Poder" DROP CONSTRAINT "Poder_criador_id_fkey";

-- AlterTable
ALTER TABLE "Personagem" DROP COLUMN "pontos_poder_gastos",
ADD COLUMN     "agilidade" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aparar" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "citacao" TEXT,
ADD COLUMN     "complicacoes_texto" TEXT,
ADD COLUMN     "consciencia" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "destreza" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "equipamentos_texto" TEXT,
ADD COLUMN     "esquiva" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ficha_snapshot" JSONB,
ADD COLUMN     "forca" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fortitude" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "imagem_posicao" JSONB DEFAULT '{"x": 50, "y": 20, "zoom": 1.0}',
ADD COLUMN     "intelecto" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "luta" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pericias_parsed" JSONB DEFAULT '[]',
ADD COLUMN     "pericias_texto" TEXT,
ADD COLUMN     "poderes_texto" TEXT,
ADD COLUMN     "presenca" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resistencia" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vantagens_texto" TEXT,
ADD COLUMN     "vigor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vontade" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Atributo";

-- DropTable
DROP TABLE "PersonagemComplicacao";

-- DropTable
DROP TABLE "PersonagemPericia";

-- DropTable
DROP TABLE "PersonagemPoder";

-- DropTable
DROP TABLE "PersonagemVantagem";

-- DropTable
DROP TABLE "Poder";
