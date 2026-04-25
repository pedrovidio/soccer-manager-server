-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco_cep" TEXT NOT NULL,
    "endereco_logradouro" TEXT NOT NULL,
    "endereco_numero" TEXT NOT NULL,
    "endereco_complemento" TEXT,
    "endereco_bairro" TEXT NOT NULL,
    "endereco_cidade" TEXT NOT NULL,
    "endereco_uf" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "sexo" TEXT NOT NULL,
    "posicao" TEXT NOT NULL,
    "stats_velocidade" INTEGER NOT NULL,
    "stats_resistencia" INTEGER NOT NULL,
    "stats_forca" INTEGER NOT NULL,
    "stats_passe" INTEGER NOT NULL,
    "stats_chute" INTEGER NOT NULL,
    "stats_defesa" INTEGER NOT NULL,
    "stats_drible" INTEGER NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athletes_cpf_key" ON "athletes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_email_key" ON "athletes"("email");
