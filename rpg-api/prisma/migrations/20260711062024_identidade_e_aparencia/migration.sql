-- AlterTable
ALTER TABLE "Personagem" ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "cor_primaria" TEXT DEFAULT '#8b0000',
ADD COLUMN     "cor_secundaria" TEXT DEFAULT '#cccccc',
ADD COLUMN     "equipe" TEXT,
ADD COLUMN     "nome_civil" TEXT,
ADD COLUMN     "tema_blocos" TEXT DEFAULT 'escuro';
