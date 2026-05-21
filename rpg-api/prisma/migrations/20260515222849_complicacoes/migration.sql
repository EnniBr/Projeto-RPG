-- CreateTable
CREATE TABLE "PersonagemComplicacao" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "personagem_id" INTEGER NOT NULL,

    CONSTRAINT "PersonagemComplicacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PersonagemComplicacao" ADD CONSTRAINT "PersonagemComplicacao_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "Personagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
