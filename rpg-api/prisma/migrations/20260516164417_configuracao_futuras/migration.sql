-- AlterTable
ALTER TABLE "Personagem" ADD COLUMN     "owlbear_token_id" TEXT;

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "jogadores_alterar_machucados" BOOLEAN NOT NULL DEFAULT false;
