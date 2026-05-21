-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personagem" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "foto" TEXT,
    "tipo" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "Personagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atributo" (
    "id" SERIAL NOT NULL,
    "forca" INTEGER NOT NULL DEFAULT 0,
    "agilidade" INTEGER NOT NULL DEFAULT 0,
    "luta" INTEGER NOT NULL DEFAULT 0,
    "prontidao" INTEGER NOT NULL DEFAULT 0,
    "vigor" INTEGER NOT NULL DEFAULT 0,
    "destreza" INTEGER NOT NULL DEFAULT 0,
    "inteligencia" INTEGER NOT NULL DEFAULT 0,
    "presenca" INTEGER NOT NULL DEFAULT 0,
    "personagem_id" INTEGER NOT NULL,

    CONSTRAINT "Atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poder" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "consequencia" TEXT NOT NULL,
    "criador_id" INTEGER NOT NULL,

    CONSTRAINT "Poder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonagemPoder" (
    "personagem_id" INTEGER NOT NULL,
    "poder_id" INTEGER NOT NULL,

    CONSTRAINT "PersonagemPoder_pkey" PRIMARY KEY ("personagem_id","poder_id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "mestre_id" INTEGER NOT NULL,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoPersonagem" (
    "sessao_id" INTEGER NOT NULL,
    "personagem_id" INTEGER NOT NULL,
    "em_cena" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SessaoPersonagem_pkey" PRIMARY KEY ("sessao_id","personagem_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Atributo_personagem_id_key" ON "Atributo"("personagem_id");

-- AddForeignKey
ALTER TABLE "Personagem" ADD CONSTRAINT "Personagem_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atributo" ADD CONSTRAINT "Atributo_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "Personagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poder" ADD CONSTRAINT "Poder_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonagemPoder" ADD CONSTRAINT "PersonagemPoder_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "Personagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonagemPoder" ADD CONSTRAINT "PersonagemPoder_poder_id_fkey" FOREIGN KEY ("poder_id") REFERENCES "Poder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_mestre_id_fkey" FOREIGN KEY ("mestre_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoPersonagem" ADD CONSTRAINT "SessaoPersonagem_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "Sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoPersonagem" ADD CONSTRAINT "SessaoPersonagem_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "Personagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
