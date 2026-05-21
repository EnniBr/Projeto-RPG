import json

data = {
    "sistema": "Mutantes & Malfeitores 3ª Edição",
    "versao_json": "1.0",
    "idioma": "pt-BR",
    "niveis_de_poder": {
        "descricao": "O nível de poder define os limites das características do personagem e quantos pontos de poder ele tem para gastar.",
        "tabela_pontos_iniciais": [
            {"nivel": 1, "pontos": 15}, {"nivel": 2, "pontos": 30}, {"nivel": 3, "pontos": 45},
            {"nivel": 4, "pontos": 60}, {"nivel": 5, "pontos": 75}, {"nivel": 6, "pontos": 90},
            {"nivel": 7, "pontos": 105}, {"nivel": 8, "pontos": 120}, {"nivel": 9, "pontos": 135},
            {"nivel": 10, "pontos": 150}, {"nivel": 11, "pontos": 165}, {"nivel": 12, "pontos": 180},
            {"nivel": 13, "pontos": 195}, {"nivel": 14, "pontos": 210}, {"nivel": 15, "pontos": 225},
            {"nivel": 16, "pontos": 240}, {"nivel": 17, "pontos": 255}, {"nivel": 18, "pontos": 270},
            {"nivel": 19, "pontos": 285}, {"nivel": 20, "pontos": 300}
        ],
        "limites": [
            {"nome": "Modificador de Perícia", "descricao": "Graduações de habilidade + graduações de perícia + modificadores de vantagem não podem exceder nível de poder + 10."},
            {"nome": "Ataque & Efeito", "descricao": "Bônus de ataque + graduações de efeito de ataque não podem exceder o dobro do nível de poder."},
            {"nome": "Esquiva & Resistência", "descricao": "Total de Esquiva e Resistência não pode exceder o dobro do nível de poder."},
            {"nome": "Aparar & Resistência", "descricao": "Total de Aparar e Resistência não pode exceder o dobro do nível de poder."},
            {"nome": "Fortitude & Vontade", "descricao": "Total de Fortitude e Vontade não pode exceder o dobro do nível de poder."}
        ],
        "custo_caracteristicas": {
            "habilidade": "2 pontos por graduação",
            "defesa": "1 ponto por graduação",
            "pericia": "1 ponto por 2 graduações",
            "vantagem": "1 ponto por vantagem ou graduação",
            "poder": "(custo base do efeito + extras - falhas) x graduações + modificadores fixos"
        }
    },
    "habilidades": [
        {
            "nome": "Força",
            "sigla": "FOR",
            "descricao": "Poder muscular e físico bruto. Determina quanto você pode levantar, carregar, empurrar e quanto dano causa em combate corpo a corpo.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Dano corpo a corpo", "Capacidade de carga"],
            "tabela_medidas": "Graduação 0 = 50 kg, cada +1 dobra a capacidade"
        },
        {
            "nome": "Vigor",
            "sigla": "VIG",
            "descricao": "Saúde, resistência e condição física geral. Determina a Resistência base e a defesa Fortitude base.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Fortitude base", "Resistência base"]
        },
        {
            "nome": "Agilidade",
            "sigla": "AGI",
            "descricao": "Equilíbrio, graciosidade e coordenação geral. Determina a Esquiva base e é usado em perícias como Acrobacia e Furtividade.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Esquiva base", "Iniciativa base"]
        },
        {
            "nome": "Destreza",
            "sigla": "DES",
            "descricao": "Coordenação mão-olho e precisão. Usada para ataques à distância e perícias como Prestidigitação.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Ataque à distância base"]
        },
        {
            "nome": "Luta",
            "sigla": "LUT",
            "descricao": "Habilidade de combate corpo a corpo. Determina o bônus de ataque corpo a corpo base e a defesa Aparar base.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Ataque corpo a corpo base", "Aparar base"]
        },
        {
            "nome": "Intelecto",
            "sigla": "INT",
            "descricao": "Inteligência, raciocínio e capacidade de aprendizado. Usada para perícias como Investigação, Tecnologia e Especialidade.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Perícias mentais"]
        },
        {
            "nome": "Consciência",
            "sigla": "CON",
            "descricao": "Intuição, percepção e consciência do ambiente. Determina a defesa Vontade base e é usada para Percepção e Intuição.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Vontade base", "Percepção"]
        },
        {
            "nome": "Presença",
            "sigla": "PRE",
            "descricao": "Força de personalidade, carisma e força de vontade social. Usada para Enganação, Intimidação e Persuasão.",
            "custo_por_graduacao": 2,
            "efeitos_associados": ["Perícias sociais"]
        }
    ],
    "defesas": [
        {
            "nome": "Esquiva",
            "sigla": "ESQ",
            "habilidade_base": "Agilidade",
            "descricao": "Capacidade de evitar ataques à distância e efeitos de área. Classe de Dificuldade para ataques à distância contra você é 10 + Esquiva.",
            "custo_por_graduacao": 1,
            "nota": "Custo é para graduações ALÉM da base fornecida pela Agilidade."
        },
        {
            "nome": "Aparar",
            "sigla": "APA",
            "habilidade_base": "Luta",
            "descricao": "Capacidade de bloquear ou desviar ataques corpo a corpo. CD para ataques corpo a corpo contra você é 10 + Aparar.",
            "custo_por_graduacao": 1,
            "nota": "Custo é para graduações ALÉM da base fornecida pela Luta."
        },
        {
            "nome": "Fortitude",
            "sigla": "FORT",
            "habilidade_base": "Vigor",
            "descricao": "Resistência a efeitos físicos como venenos, doenças e fadiga. Teste de salvamento de Fortitude = d20 + Fortitude.",
            "custo_por_graduacao": 1,
            "nota": "Custo é para graduações ALÉM da base fornecida pelo Vigor."
        },
        {
            "nome": "Vontade",
            "sigla": "VON",
            "habilidade_base": "Consciência",
            "descricao": "Resistência a efeitos mentais como controle mental, ilusões e medo. Teste de salvamento de Vontade = d20 + Vontade.",
            "custo_por_graduacao": 1,
            "nota": "Custo é para graduações ALÉM da base fornecida pela Consciência."
        },
        {
            "nome": "Resistência",
            "sigla": "RES",
            "habilidade_base": "Vigor",
            "descricao": "Capacidade de resistir a dano físico. Não pode ser comprada diretamente; melhore com Vigor, Proteção ou Defesa Aprimorada.",
            "custo_por_graduacao": None,
            "nota": "Igual a Vigor + graduações de Proteção e outros efeitos. Não tem custo direto."
        }
    ],
    "pericias": [
        {
            "nome": "Acrobacia",
            "habilidade_vinculada": "Agilidade",
            "treinada": False,
            "descricao": "Equilíbrio, manobras acrobáticas, saltos e amortecer quedas.",
            "exemplos_de_uso": [
                "Manter equilíbrio em superfícies estreitas (CD 10-20)",
                "Saltar obstáculos e realizar manobras acrobáticas",
                "Amortecer quedas reduzindo dano",
                "Mover-se por espaços apertados"
            ]
        },
        {
            "nome": "Atletismo",
            "habilidade_vinculada": "Força",
            "treinada": False,
            "descricao": "Escalar, nadar, saltar e outras atividades atléticas gerais.",
            "exemplos_de_uso": [
                "Escalar superfícies (CD 10-25)",
                "Nadar em águas turbulentas (CD 15-20)",
                "Saltos em distância e altura",
                "Corrida e resistência física"
            ]
        },
        {
            "nome": "Enganação",
            "habilidade_vinculada": "Presença",
            "treinada": False,
            "descricao": "Mentir, disfarçar-se, criar distração, fingir e manobrar socialmente.",
            "exemplos_de_uso": [
                "Mentir de forma convincente (oposto a Intuição do alvo)",
                "Criar disfarces (CD 10-25 dependendo da complexidade)",
                "Criar distrações em combate",
                "Fingir estar ferido ou incapacitado",
                "Fintar em combate (oposto a Enganação ou Intuição do alvo)"
            ]
        },
        {
            "nome": "Especialidade",
            "habilidade_vinculada": "Intelecto",
            "treinada": True,
            "descricao": "Conhecimento acadêmico ou profissional em uma área específica. Cada tipo é uma perícia separada.",
            "tipos": [
                "Ciências Biológicas", "Ciências Exatas", "Ciências da Terra",
                "Negócios", "Arte", "Direito", "História", "Teologia",
                "Cultura Pop", "Streetwise", "Tática", "Magia/Misticismo",
                "Tecnologia Alienígena", "Ciências Sociais"
            ],
            "exemplos_de_uso": [
                "Recordar conhecimento sobre um tema (CD 10-30)",
                "Identificar substâncias, criaturas ou fenômenos",
                "Analisar evidências com conhecimento especializado"
            ]
        },
        {
            "nome": "Furtividade",
            "habilidade_vinculada": "Agilidade",
            "treinada": False,
            "descricao": "Mover-se silenciosamente e esconder-se de outros.",
            "exemplos_de_uso": [
                "Esgueirar-se sem ser notado (oposto a Percepção)",
                "Esconder-se atrás de cobertura",
                "Seguir alguém sem ser detectado",
                "Criar diversão para escapar"
            ]
        },
        {
            "nome": "Intimidação",
            "habilidade_vinculada": "Presença",
            "treinada": False,
            "descricao": "Assustar, coagir ou intimidar outros através de ameaças ou demonstrações de poder.",
            "exemplos_de_uso": [
                "Desmoralizar oponente em combate (oposto a Intuição/Vontade)",
                "Coagir alguém a cooperar",
                "Assustar civis ou bandidos",
                "Usar reputação para intimidar"
            ]
        },
        {
            "nome": "Investigação",
            "habilidade_vinculada": "Intelecto",
            "treinada": True,
            "descricao": "Coletar e analisar pistas, fazer pesquisas, buscar informações e vigilância.",
            "exemplos_de_uso": [
                "Vasculhar uma área em busca de pistas (CD 10-25)",
                "Analisar uma cena de crime",
                "Pesquisar informações em registros ou computadores",
                "Contra-vigilância e varredura de escutas"
            ]
        },
        {
            "nome": "Percepção",
            "habilidade_vinculada": "Consciência",
            "treinada": False,
            "descricao": "Notar coisas usando seus sentidos - ver, ouvir, farejar e sentir coisas ao redor.",
            "exemplos_de_uso": [
                "Notar alguém se escondendo (oposto a Furtividade)",
                "Detectar uma emboscada",
                "Perceber detalhes sutis em uma cena",
                "Ler lábios à distância (CD 15+)",
                "Ouvir conversas através de paredes (CD 15+)"
            ]
        },
        {
            "nome": "Persuasão",
            "habilidade_vinculada": "Presença",
            "treinada": False,
            "descricao": "Influenciar outros através de diplomacia, charme, liderança e negociação.",
            "exemplos_de_uso": [
                "Convencer alguém de algo (oposto a Intuição/Vontade)",
                "Negociar acordos favoráveis",
                "Inspirar aliados",
                "Obter favores e informações"
            ]
        },
        {
            "nome": "Prestidigitação",
            "habilidade_vinculada": "Destreza",
            "treinada": True,
            "descricao": "Truques com as mãos, pickpocket, abrir fechaduras, desarmar armadilhas e esconder objetos pequenos.",
            "exemplos_de_uso": [
                "Abrir fechaduras mecânicas (CD 20-30)",
                "Bater carteiras (oposto a Percepção)",
                "Esconder objetos pequenos na pessoa",
                "Desarmar armadilhas mecânicas (CD 20+)",
                "Truques de mão e mágica de palco"
            ]
        },
        {
            "nome": "Tecnologia",
            "habilidade_vinculada": "Intelecto",
            "treinada": True,
            "descricao": "Operar, construir, reparar e inventar dispositivos tecnológicos, eletrônicos e mecânicos.",
            "exemplos_de_uso": [
                "Construir ou reparar dispositivos (CD 15-30)",
                "Hackear sistemas de computador (CD 15-30)",
                "Desarmar dispositivos eletrônicos (CD 20+)",
                "Inventar dispositivos temporários (Invenção)",
                "Operar equipamento complexo"
            ]
        },
        {
            "nome": "Tratamento",
            "habilidade_vinculada": "Intelecto",
            "treinada": True,
            "descricao": "Primeiros socorros, medicina, cirurgia e cuidados médicos.",
            "exemplos_de_uso": [
                "Estabilizar alguém à beira da morte (CD 15)",
                "Tratar ferimentos e doenças (CD 15-25)",
                "Reanimar alguém incapacitado (CD 15)",
                "Realizar cirurgias de campo"
            ]
        },
        {
            "nome": "Veículos",
            "habilidade_vinculada": "Destreza",
            "treinada": False,
            "descricao": "Pilotar veículos terrestres, aquáticos, aéreos e até espaciais.",
            "exemplos_de_uso": [
                "Manobras difíceis com veículos (CD 15-25)",
                "Perseguição de alta velocidade",
                "Pilotar veículos desconhecidos (CD 15+)",
                "Combate veicular"
            ]
        },
        {
            "nome": "Combate Desarmado",
            "habilidade_vinculada": "Luta",
            "treinada": False,
            "descricao": "Habilidade de combate corpo a corpo sem armas. Cada graduação além da Luta base é comprada como perícia.",
            "exemplos_de_uso": [
                "Ataques corpo a corpo desarmados",
                "Agarrar oponentes",
                "Manobras de combate"
            ]
        },
        {
            "nome": "Combate Armado",
            "habilidade_vinculada": "Luta",
            "treinada": False,
            "descricao": "Habilidade de combate corpo a corpo com armas específicas. Comprada separadamente para cada tipo de arma ou grupo.",
            "exemplos_de_uso": [
                "Ataques com espada, bastão, etc.",
                "Uso de armas improvisadas"
            ]
        },
        {
            "nome": "Mira",
            "habilidade_vinculada": "Destreza",
            "treinada": False,
            "descricao": "Habilidade de combate à distância. Usada para ataques à distância com armas de fogo, poderes de longo alcance, etc.",
            "exemplos_de_uso": [
                "Disparar armas de fogo",
                "Usar poderes de ataque à distância",
                "Arremessar objetos com precisão"
            ]
        }
    ],
    "vantagens": {
        "descricao": "Vantagens são características especiais que dão a seu personagem benefícios únicos. Custam 1 ponto de poder por vantagem ou por graduação.",
        "categorias": {
            "combate": [
                {"nome": "Ataque Acurado", "custo": "1 por graduação", "graduada": True, "descricao": "Troca +2 do bônus de efeito por +1 no bônus de ataque quando ataca.", "pre_requisitos": None},
                {"nome": "Ataque Poderoso", "custo": "1 por graduação", "graduada": True, "descricao": "Troca +1 do bônus de ataque por +2 no bônus de efeito quando ataca.", "pre_requisitos": None},
                {"nome": "Defesa Acurada", "custo": "1 por graduação", "graduada": True, "descricao": "Troca +2 da Resistência por +1 na defesa ativa (Esquiva ou Aparar).", "pre_requisitos": None},
                {"nome": "Defesa Poderosa", "custo": "1 por graduação", "graduada": True, "descricao": "Troca +1 de defesa ativa por +2 de Resistência.", "pre_requisitos": None},
                {"nome": "Ataque Aprimorado", "custo": "1 por graduação", "graduada": True, "descricao": "+1 no bônus de ataque corpo a corpo ou à distância por graduação.", "pre_requisitos": None},
                {"nome": "Defesa Aprimorada", "custo": "1 por graduação", "graduada": True, "descricao": "+1 na Esquiva ou Aparar por graduação.", "pre_requisitos": None},
                {"nome": "Iniciativa Aprimorada", "custo": "1 por graduação", "graduada": True, "descricao": "+4 na Iniciativa por graduação.", "pre_requisitos": None},
                {"nome": "Acerto Crítico Aprimorado", "custo": "1 por graduação", "graduada": True, "descricao": "Acerto crítico com um ataque com resultado de 19-20 (+1 de margem por graduação, máximo de 16-20).", "pre_requisitos": None},
                {"nome": "Agarrar Aprimorado", "custo": 1, "graduada": False, "descricao": "Pode fazer testes de agarrar com uma mão, mantendo a outra livre. Não fica vulnerável ao agarrar.", "pre_requisitos": None},
                {"nome": "Derrubar Aprimorado", "custo": 1, "graduada": False, "descricao": "Não sofre ataque de oportunidade quando tenta derrubar. Derrubar não tem penalidade se falhar.", "pre_requisitos": None},
                {"nome": "Desarmar Aprimorado", "custo": 1, "graduada": False, "descricao": "Não sofre ataque de oportunidade quando tenta desarmar. Desarme sem penalidade se falhar.", "pre_requisitos": None},
                {"nome": "Fintar Aprimorado", "custo": 1, "graduada": False, "descricao": "Pode fintar como ação de movimento em vez de ação padrão.", "pre_requisitos": None},
                {"nome": "Luta Defensiva", "custo": 1, "graduada": False, "descricao": "+2 nas defesas ativas (Esquiva e Aparar) quando luta defensivamente, em vez de +1.", "pre_requisitos": None},
                {"nome": "Lutador Ameaçador", "custo": 1, "graduada": False, "descricao": "Ameaça todos os inimigos dentro de 1,5 metros, podendo fazer ataques de oportunidade.", "pre_requisitos": None},
                {"nome": "Mover e Atacar", "custo": 1, "graduada": False, "descricao": "Pode se mover e realizar um ataque à distância sem penalidade de -5.", "pre_requisitos": None},
                {"nome": "Ataque de Encontrão Aprimorado", "custo": 1, "graduada": False, "descricao": "Quando realiza um encontrão (charge), não fica vulnerável após o ataque.", "pre_requisitos": None},
                {"nome": "Acerto Decisivo", "custo": 1, "graduada": False, "descricao": "Quando rola ameaça de crítico e confirma, pode acrescentar +5 ao efeito ou aplicar um efeito adicional.", "pre_requisitos": None},
                {"nome": "Ataques Rápidos", "custo": 1, "graduada": False, "descricao": "Pode fazer dois ataques corpo a corpo como ação padrão, com -2 em cada teste de ataque.", "pre_requisitos": None},
                {"nome": "Interposição", "custo": 1, "graduada": False, "descricao": "Pode se colocar no lugar de um aliado adjacente quando ele é atacado, recebendo o ataque.", "pre_requisitos": None},
                {"nome": "Recuar", "custo": 1, "graduada": False, "descricao": "Pode se mover até metade de seu deslocamento ao ser atingido, reduzindo -1 na CD do salvamento de Resistência por 1,5m movido (máximo -5).", "pre_requisitos": None}
            ],
            "fortuna": [
                {"nome": "Sorte", "custo": "1 por graduação", "graduada": True, "descricao": "Ganha um ponto de heroísmo extra por sessão por graduação (até o limite do NP).", "pre_requisitos": None},
                {"nome": "Sorte do Iniciante", "custo": 1, "graduada": False, "descricao": "Pode usar qualquer perícia treinada destreinada uma vez por sessão com um bônus.", "pre_requisitos": None},
                {"nome": "Inspiração", "custo": 1, "graduada": False, "descricao": "Quando gasta um ponto heroico para re-rolar, rola 2 dados e pega o melhor resultado.", "pre_requisitos": None},
                {"nome": "Determinação", "custo": 1, "graduada": False, "descricao": "Quando deveria ser incapacitado ou pior, pode gastar um ponto heroico para permanecer atordoado.", "pre_requisitos": None}
            ],
            "geral": [
                {"nome": "Benefício", "custo": "1 por graduação", "graduada": True, "descricao": "Um benefício social ou material: riqueza, status, posição de autoridade, identidade alternativa, etc.", "pre_requisitos": None},
                {"nome": "Conexões", "custo": 1, "graduada": False, "descricao": "Tem contatos e conexões que pode procurar para obter informações e ajuda.", "pre_requisitos": None},
                {"nome": "Equipamento", "custo": "1 por graduação (5 pontos de equipamento por graduação)", "graduada": True, "descricao": "Tem 5 pontos de equipamento por graduação para gastar em equipamento, quartéis-generais e veículos.", "pre_requisitos": None},
                {"nome": "Sede", "custo": "1 por graduação", "graduada": True, "descricao": "Tem um quartel-general com características especiais (tamanho, resistência, características).", "pre_requisitos": "Equipamento"},
                {"nome": "Idiomas", "custo": "1 por graduação", "graduada": True, "descricao": "Fala idiomas adicionais. 1 graduação = 2 idiomas adicionais. Pode adquirir o extra Compreender para entender todos.", "pre_requisitos": None},
                {"nome": "Trance", "custo": 1, "graduada": False, "descricao": "Pode entrar em transe meditativo, reduzindo necessidade de sono, comida e água.", "pre_requisitos": None},
                {"nome": "Resistência Aprimorada", "custo": "1 por graduação", "graduada": True, "descricao": "+1 na defesa Resistência por graduação (via efeito de Proteção).", "pre_requisitos": None}
            ],
            "pericia": [
                {"nome": "Especialização em Combate", "custo": "1 por graduação", "graduada": True, "descricao": "+2 no bônus de ataque com um tipo específico de ataque (corpo a corpo, distância ou um ataque específico) por graduação.", "pre_requisitos": None},
                {"nome": "Fascinar", "custo": 1, "graduada": False, "descricao": "Pode usar uma perícia (Enganação, Intimidação ou Persuasão) para fascinar alvos, deixando-os presos à ação.", "pre_requisitos": None},
                {"nome": "Inventor", "custo": 1, "graduada": False, "descricao": "Pode usar Tecnologia para criar invenções temporárias gastando pontos heroicos.", "pre_requisitos": "Tecnologia"},
                {"nome": "Rituais", "custo": 1, "graduada": False, "descricao": "Pode usar Especialidade (Magia) para realizar rituais mágicos como invenções.", "pre_requisitos": "Especialidade: Magia"},
                {"nome": "Rastreador", "custo": 1, "graduada": False, "descricao": "Pode seguir rastros usando Percepção. A CD varia com as condições.", "pre_requisitos": None},
                {"nome": "Atraente", "custo": "1 por graduação", "graduada": True, "descricao": "Aparência atraente que concede +2 por graduação em certos testes de interação social (Persuasão, Enganação).", "pre_requisitos": None},
                {"nome": "Avaliação", "custo": 1, "graduada": False, "descricao": "Pode avaliar as capacidades de combate de um oponente fazendo um teste de Percepção.", "pre_requisitos": None},
                {"nome": "Bem Informado", "custo": 1, "graduada": False, "descricao": "Pode fazer testes de Persuasão ou Investigação para saber informações úteis sobre pessoas ou situações.", "pre_requisitos": None},
                {"nome": "Esconder-se à Vista", "custo": 1, "graduada": False, "descricao": "Pode fazer testes de Furtividade mesmo sem cobertura ou camuflagem.", "pre_requisitos": "Furtividade 10+"},
                {"nome": "Mestre do Disfarce", "custo": 1, "graduada": False, "descricao": "Pode criar disfarces rapidamente (ação padrão) sem penalidade.", "pre_requisitos": "Enganação 10+"},
                {"nome": "Perícia Aprimorada", "custo": "1 por graduação", "graduada": True, "descricao": "Escolha uma perícia quando adquire esta vantagem. Bônus de +5 por graduação em testes rotineiros (não sob pressão) daquela perícia.", "pre_requisitos": None},
                {"nome": "Esforço Extremo", "custo": 1, "graduada": False, "descricao": "Pode usar esforço extra com benefícios adicionais além do normal.", "pre_requisitos": None},
                {"nome": "Eidética", "custo": 1, "graduada": False, "descricao": "Memória perfeita. Pode recordar qualquer coisa que tenha experimentado com um teste de Intelecto.", "pre_requisitos": None},
                {"nome": "Sem Medo", "custo": 1, "graduada": False, "descricao": "Imune a efeitos de medo e intimidação.", "pre_requisitos": None}
            ]
        }
    },
    "efeitos_de_poderes": {
        "descricao": "Efeitos são os blocos de construção dos poderes. Cada efeito tem um custo base por graduação, tipo de ação, alcance e duração.",
        "tipos_de_acao": ["Padrão", "Movimento", "Livre", "Reação", "Nenhuma"],
        "tipos_de_alcance": ["Pessoal", "Perto", "À Distância", "Percepção"],
        "tipos_de_duracao": ["Instantâneo", "Concentração", "Sustentado", "Contínuo", "Permanente"],
        "efeitos": [
            {
                "nome": "Aflição",
                "tipo": "ataque",
                "acao": "Padrão",
                "alcance": "Perto",
                "duracao": "Instantâneo",
                "custo_base": 1,
                "descricao": "Impõe condições debilitantes ao alvo. Você escolhe três condições progressivas ao adquirir. O alvo faz um teste de salvamento (Fortitude ou Vontade). 1 grau de falha = 1ª condição, 2 graus = 2ª condição, 3 graus = 3ª condição.",
                "causa_dano": False,
                "resistencia": "Fortitude ou Vontade (escolhida na criação)",
                "condicoes_exemplo": {
                    "1o_grau": ["Atordoado", "Debilitado", "Vulnerável", "Enfraquecido", "Impedido"],
                    "2o_grau": ["Prostrado", "Aturdido", "Indefeso", "Imóvel", "Desacordado"],
                    "3o_grau": ["Controlado", "Incapacitado", "Paralisado", "Transformado", "Inconsciente"]
                },
                "exemplos": ["Raio atordoante", "Gás paralisante", "Controle mental", "Olhar petrificante"]
            },
            {
                "nome": "Comunicação",
                "tipo": "sensorial",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 4,
                "descricao": "Pode se comunicar com outros à longa distância. Cada graduação aumenta o alcance. 1 = Perto (voz alta), 2 = 30m, 3 = 500m, 4 = 1,5km, 5 = ilimitado.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Telepatia", "Rádio mental", "Ondas sonoras direcionadas"]
            },
            {
                "nome": "Compreender",
                "tipo": "sensorial",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 2,
                "descricao": "Pode compreender idiomas que não conhece. 1 graduação = um idioma ou todos os idiomas de um tipo (falados, escritos, máquinas). 2 graduações = todos os idiomas.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Poliglota sobrenatural", "Interface com máquinas", "Telepatia linguística"]
            },
            {
                "nome": "Controle Mental",
                "tipo": "ataque",
                "acao": "Padrão",
                "alcance": "Percepção",
                "duracao": "Concentração (resultado sustentado)",
                "custo_base": 4,
                "descricao": "Você controla as ações de outro personagem. O alvo faz um salvamento de Vontade. Com 1 grau de falha, dá uma diretriz simples. Com 2 graus, controle limitado. Com 3 graus, controle total.",
                "causa_dano": False,
                "resistencia": "Vontade",
                "exemplos": ["Hipnose", "Dominação psíquica", "Controle de feromônios"]
            },
            {
                "nome": "Criar",
                "tipo": "controle",
                "acao": "Padrão",
                "alcance": "À Distância",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Cria objetos sólidos do nada. Volume é baseado na graduação. Os objetos têm Resistência igual à graduação do efeito e podem fornecer cobertura.",
                "causa_dano": False,
                "resistencia": "Esquiva (para aprisionar)",
                "exemplos": ["Construtos de energia", "Criação de gelo", "Materialização", "Paredes de força"]
            },
            {
                "nome": "Dano",
                "tipo": "ataque",
                "acao": "Padrão",
                "alcance": "Perto",
                "duracao": "Instantâneo",
                "custo_base": 1,
                "descricao": "Causa dano ao alvo. O alvo faz um teste de salvamento de Resistência com CD 15 + graduação do efeito. 1 grau de falha = -1 na Resistência. 2 graus = atordoado + -1 Resistência. 3 graus = prostrado + -1 Resistência. 4 graus = incapacitado.",
                "causa_dano": True,
                "dano_graduacao": "CD = 15 + graduação",
                "resistencia": "Resistência",
                "exemplos": ["Soco super-forte", "Rajada de energia", "Garras", "Raio laser"]
            },
            {
                "nome": "Encolher",
                "tipo": "geral",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Reduz seu tamanho. Cada graduação reduz sua categoria de tamanho em 1, concedendo bônus de +1 em Esquiva e Furtividade, mas -1 em Força e Intimidação por graduação.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Miniaturização", "Forma de inseto", "Redução atômica"]
            },
            {
                "nome": "Enfraquecer",
                "tipo": "ataque",
                "acao": "Padrão",
                "alcance": "Perto",
                "duracao": "Instantâneo",
                "custo_base": 1,
                "descricao": "Reduz uma habilidade, defesa ou poder do alvo. O alvo faz um salvamento de Fortitude. Cada grau de falha reduz a característica afetada em 1 graduação. A redução se recupera 1 por rodada.",
                "causa_dano": False,
                "resistencia": "Fortitude",
                "exemplos": ["Drenar energia", "Enfraquecer poderes", "Soro de fraqueza"]
            },
            {
                "nome": "Crescer",
                "tipo": "geral",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Aumenta seu tamanho. Cada graduação aumenta sua categoria de tamanho. Ganha +1 em Força e Intimidação, mas -1 em Esquiva e Furtividade por graduação.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Gigantismo", "Crescimento monstruoso", "Forma colossal"]
            },
            {
                "nome": "Ilusão",
                "tipo": "controle",
                "acao": "Padrão",
                "alcance": "Percepção",
                "duracao": "Sustentado",
                "custo_base": "1-5 (depende dos sentidos afetados)",
                "descricao": "Cria ilusões sensoriais. 1 ponto por sentido afetado (visual = 2 pontos). Alvos podem fazer teste de Vontade para desacreditar. Volume afetado baseado na graduação.",
                "causa_dano": False,
                "resistencia": "Vontade",
                "custos_por_sentido": {"visual": 2, "auditivo": 1, "olfativo": 1, "tatil": 1},
                "exemplos": ["Hologramas", "Imagens fantasma", "Ilusões psíquicas", "Camuflagem"]
            },
            {
                "nome": "Camuflagem",
                "tipo": "sensorial",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Você fica oculto a um sentido específico. 2 pontos por tipo de sentido. Visual = 4 pontos por ser o principal. Pode afetar todos os sentidos com custo apropriado.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Invisibilidade", "Silêncio sobrenatural", "Inodoro"]
            },
            {
                "nome": "Cura",
                "tipo": "controle",
                "acao": "Padrão",
                "alcance": "Perto",
                "duracao": "Instantâneo",
                "custo_base": 2,
                "descricao": "Cura dano e condições causadas por dano. Faça um teste de poder (d20 + graduação) contra CD 10 + as penalidades de Resistência do alvo. Sucesso remove todas as penalidades de dano.",
                "causa_dano": False,
                "resistencia": "Nenhuma (benéfico)",
                "exemplos": ["Cura divina", "Regeneração de tecidos", "Nanorrobôs médicos"]
            },
            {
                "nome": "Escavação",
                "tipo": "movimento",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 1,
                "descricao": "Pode cavar através de materiais sólidos. Velocidade de escavação baseada na graduação (1 = 0,5 m/rodada em terra, metade disso em rocha).",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Garras de escavação", "Dissolução de terra", "Tunelamento"]
            },
            {
                "nome": "Imunidade",
                "tipo": "defesa",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Imune a certos efeitos ou condições. Custo varia: 1 ponto para efeitos raros/específicos, 2 para um descritor, 5 para um tipo amplo, 10 para muito amplo, 20 para um salvamento inteiro, 30 para Fortitude + Resistência, 40 para todos os danos, 80 para todos os efeitos.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "custos_comuns": [
                    {"efeito": "Envelhecimento", "custo": 1},
                    {"efeito": "Veneno", "custo": 1},
                    {"efeito": "Doença", "custo": 1},
                    {"efeito": "Condições ambientais (calor/frio)", "custo": 2},
                    {"efeito": "Necessidade de dormir", "custo": 1},
                    {"efeito": "Necessidade de comer/beber", "custo": 1},
                    {"efeito": "Necessidade de respirar", "custo": 1},
                    {"efeito": "Suporte vital completo", "custo": 5},
                    {"efeito": "Dano de um descritor (fogo, frio, etc.)", "custo": 5},
                    {"efeito": "Acertos críticos", "custo": 2},
                    {"efeito": "Efeitos de Fortitude", "custo": 30},
                    {"efeito": "Efeitos de Resistência", "custo": 40}
                ],
                "exemplos": ["Invulnerabilidade ao fogo", "Imunidade a venenos", "Não precisa respirar"]
            },
            {
                "nome": "Imortalidade",
                "tipo": "defesa",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 2,
                "descricao": "Quando morre, retorna à vida após um tempo. A graduação determina o tempo: 1 = 2 semanas, 2 = 1 semana, 5 = 1 minuto, etc.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Regeneração imortal", "Ressurreição automática", "Fênix"]
            },
            {
                "nome": "Invocar",
                "tipo": "controle",
                "acao": "Padrão",
                "alcance": "Perto",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Invoca uma criatura ou servitor que age sob suas ordens. A criatura tem pontos de poder iguais a 15 x graduação do efeito. É um personagem controlado pelo mestre com suas diretrizes.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Invocar demônio", "Chamar animal", "Criar construto autônomo", "Duplicata"]
            },
            {
                "nome": "Mover Objeto",
                "tipo": "controle",
                "acao": "Padrão",
                "alcance": "À Distância",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Move objetos e criaturas à distância, como telecinésia. Graduação funciona como Força para determinar peso que pode mover. Pode ser usado como ataque para jogar objetos (bônus de dano = graduação -1).",
                "causa_dano": False,
                "resistencia": "Nenhuma (Esquiva se usado como ataque)",
                "exemplos": ["Telecinésia", "Magnetismo", "Controle gravitacional"]
            },
            {
                "nome": "Morfar",
                "tipo": "geral",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": "5 (forma única) / 7 (formas limitadas) / 9 (qualquer forma)",
                "descricao": "Muda de forma. A graduação adiciona bônus ao teste de Enganação para seu disfarce. 1 forma específica = 5 pts, formas de um grupo = 7 pts, qualquer forma = 9 pts. Só muda aparência, não ganha poderes.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Metamorfo", "Imitador de faces", "Shapeshifter"]
            },
            {
                "nome": "Movimento",
                "tipo": "movimento",
                "acao": "Livre (ativar)",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Ganha um modo de movimento especial. Cada 2 pontos compra um tipo de movimento: Andar nas Paredes, Andar na Água, Balanço, Queda Segura, Escorregar, Sem Rastros, etc.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "tipos": [
                    {"nome": "Andar nas Paredes", "custo": 2, "descricao": "Move-se por superfícies verticais e tetos."},
                    {"nome": "Andar na Água", "custo": 2, "descricao": "Move-se pela superfície da água."},
                    {"nome": "Balanço", "custo": 2, "descricao": "Balança em cabos, teias ou cipós na velocidade de movimento terrestre."},
                    {"nome": "Escorregar", "custo": 2, "descricao": "Pode escapar de agarrões e restrições automaticamente."},
                    {"nome": "Queda Segura", "custo": 2, "descricao": "Cai sem sofrer dano (planando, agarrando, etc.)."},
                    {"nome": "Dimensional", "custo": 2, "descricao": "Pode se mover entre dimensões."},
                    {"nome": "Sem Rastros", "custo": 2, "descricao": "Não deixa rastros ao se mover."},
                    {"nome": "Passagem", "custo": 2, "descricao": "Pode se mover através de matéria sólida."}
                ],
                "exemplos": ["Escalar paredes como aranha", "Caminhar sobre água", "Planar"]
            },
            {
                "nome": "Nulificar",
                "tipo": "ataque",
                "acao": "Padrão",
                "alcance": "À Distância",
                "duracao": "Instantâneo",
                "custo_base": 1,
                "descricao": "Contra-ataca ou neutraliza um efeito ou poder. Faça um teste de poder contra o efeito alvo (d20 + graduação de Nulificar contra CD 10 + graduação do efeito). Sucesso desativa o efeito.",
                "causa_dano": False,
                "resistencia": "Teste de poder (Vontade para efeitos pessoais)",
                "exemplos": ["Anular poderes", "Campo anti-magia", "Disruptor de energia"]
            },
            {
                "nome": "Proteção",
                "tipo": "defesa",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Aumenta sua Resistência em +1 por graduação. A Resistência total não pode exceder os limites do NP quando somada ao Vigor.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Pele blindada", "Campo de força passivo", "Armadura natural"]
            },
            {
                "nome": "Rapidez",
                "tipo": "geral",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 1,
                "descricao": "Realiza tarefas rotineiras muito rapidamente. Cada graduação reduz o tempo necessário em um passo na tabela de tempo.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Leitura veloz", "Construção rápida", "Pensamento acelerado"]
            },
            {
                "nome": "Regeneração",
                "tipo": "defesa",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Recupera-se de dano automaticamente. A graduação determina a velocidade: 1 = 1 por 10 minutos, 5 = 1 por rodada, 10 = 1 por turno.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Fator de cura", "Regeneração celular", "Nanorrobôs reparadores"]
            },
            {
                "nome": "Sentidos",
                "tipo": "sensorial",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Sentidos aprimorados ou especiais. Custo varia por tipo de sentido adquirido.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "tipos": [
                    {"nome": "Visão no Escuro", "custo": 1, "descricao": "Vê normalmente na escuridão."},
                    {"nome": "Visão de Raios-X", "custo": 4, "descricao": "Vê através de objetos sólidos."},
                    {"nome": "Infravermelho", "custo": 1, "descricao": "Vê fontes de calor."},
                    {"nome": "Ultravermelho", "custo": 1, "descricao": "Vê espectro ultravioleta."},
                    {"nome": "Sentido de Perigo", "custo": 1, "descricao": "Sentido sobrenatural de perigo iminente. Nunca fica vulnerável."},
                    {"nome": "Sentido de Direção", "custo": 1, "descricao": "Sempre sabe onde está o norte e pode refazer caminhos."},
                    {"nome": "Rádio", "custo": 1, "descricao": "Capta sinais de rádio."},
                    {"nome": "Sentido à Distância", "custo": 1, "descricao": "Pode usar um sentido a grandes distâncias (como clarivision)."},
                    {"nome": "Sentido Acurado", "custo": 2, "descricao": "Um sentido normalmente vago se torna acurado (pode localizar precisamente)."},
                    {"nome": "Sentido Aguçado", "custo": 1, "descricao": "+2 por graduação em testes de Percepção com um sentido."},
                    {"nome": "Sentido Analítico", "custo": 1, "descricao": "Pode analisar detalhes de algo que percebe (composição, etc.)."},
                    {"nome": "Sentido Estendido", "custo": 1, "descricao": "Multiplica o alcance de um sentido por 10 por graduação."},
                    {"nome": "Sentido Penetrante", "custo": 1, "descricao": "Sentido não é bloqueado por Camuflagem."},
                    {"nome": "Detectar", "custo": "1-2", "descricao": "Detecta algo específico (magia, eletricidade, etc.). 1 = vago, 2 = acurado."},
                    {"nome": "Audição Ultra-sônica", "custo": 1, "descricao": "Ouve frequências ultra-sônicas."},
                    {"nome": "Sentido Temporal", "custo": 1, "descricao": "Sempre sabe que horas são e pode medir o tempo com precisão."},
                    {"nome": "Rastreamento", "custo": 1, "descricao": "Pode seguir alvos usando um sentido específico."}
                ],
                "exemplos": ["Super-audição", "Visão telescópica", "Radar", "Sentido de perigo"]
            },
            {
                "nome": "Sorte",
                "tipo": "controle",
                "acao": "Livre/Reação",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 3,
                "descricao": "Controla a probabilidade a seu favor. Pode forçar re-rolagens de dados (seus ou de oponentes). Limitado a um uso por graduação por cena.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Controle de probabilidade", "Azar direcionado", "Sorte sobrenatural"]
            },
            {
                "nome": "Super-Velocidade",
                "tipo": "movimento",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": "3 (inclui Velocidade e Rapidez)",
                "descricao": "Move-se em velocidades sobre-humanas. Combina os efeitos de Velocidade (deslocamento) e Rapidez (ações rápidas). Cada graduação duplica a velocidade.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Velocidade sobre-humana", "Flash"]
            },
            {
                "nome": "Teleporte",
                "tipo": "movimento",
                "acao": "Movimento",
                "alcance": "Pessoal",
                "duracao": "Instantâneo",
                "custo_base": 2,
                "descricao": "Transporta-se instantaneamente. Graduação determina a distância máxima: 1 = 15m, 2 = 30m, 5 = 500m, 8 = 8km, 12 = 600km, 16 = planetário, 18+ = interplanetário.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Teletransporte", "Dobra espacial", "Portal dimensional"]
            },
            {
                "nome": "Transformar",
                "tipo": "ataque",
                "acao": "Padrão",
                "alcance": "Perto",
                "duracao": "Sustentado",
                "custo_base": "2-5",
                "descricao": "Transforma um alvo em algo diferente. 2 pts/grad = um material em versão do mesmo, 3 = qualquer versão do mesmo tipo, 4 = tipo diferente, 5 = qualquer coisa.",
                "causa_dano": False,
                "resistencia": "Fortitude",
                "exemplos": ["Toque de Midas", "Transmutação", "Petrificação"]
            },
            {
                "nome": "Velocidade",
                "tipo": "movimento",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 1,
                "descricao": "Aumenta sua velocidade de deslocamento. Cada graduação dobra sua velocidade terrestre. Graduação 1 = 8 km/h, 2 = 16 km/h, 5 = 120 km/h, 10 = 4000 km/h, etc.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Super-velocidade", "Pernas biônicas", "Botas propulsoras"]
            },
            {
                "nome": "Voo",
                "tipo": "movimento",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Pode voar. Velocidade aérea baseada na graduação (mesma tabela que Velocidade). Pode planar/pairar. Se o efeito for desativado, cai normalmente.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Voo autônomo", "Levitação", "Asas", "Propulsão a jato"]
            },
            {
                "nome": "Natação",
                "tipo": "movimento",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 1,
                "descricao": "Aumenta velocidade de natação. Graduação funciona como Velocidade para natação.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Natação sobre-humana", "Adaptação aquática", "Nadadeiras biônicas"]
            },
            {
                "nome": "Absorção",
                "tipo": "defesa",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Absorve energia ou dano e a converte em outra coisa (cura, poder temporário). Essencialmente uma combinação de Imunidade e um efeito reativo.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Absorção de energia", "Conversão de dano em força"]
            },
            {
                "nome": "Alongar",
                "tipo": "geral",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 1,
                "descricao": "Pode estender seus membros. Cada graduação aumenta o alcance de seus ataques corpo a corpo em 1,5m e adiciona +1 em testes de Agarrar.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Elasticidade", "Membros extensíveis", "Tentáculos"]
            },
            {
                "nome": "Característica",
                "tipo": "geral",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Uma habilidade menor que não se encaixa em outros efeitos. Cada graduação concede um benefício menor definido pelo jogador e aprovado pelo mestre.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Respirar debaixo d'água", "Mudança cosmética de cor", "Cauda preênsil"]
            },
            {
                "nome": "Controle de Ambiente",
                "tipo": "controle",
                "acao": "Padrão",
                "alcance": "À Distância",
                "duracao": "Sustentado",
                "custo_base": "1-2",
                "descricao": "Controla o ambiente ao redor. Cada tipo de controle custa 1 ou 2 pontos. Pode criar calor/frio, impedir movimento, reduzir visibilidade, etc. A área é baseada na graduação.",
                "causa_dano": False,
                "resistencia": "Fortitude ou Esquiva",
                "tipos": [
                    {"nome": "Calor/Frio", "custo": 2, "descricao": "Causa dano ambiental de calor ou frio."},
                    {"nome": "Impedir Movimento", "custo": 2, "descricao": "Terreno difícil ou escorregadio na área."},
                    {"nome": "Luminosidade", "custo": 1, "descricao": "Aumenta ou diminui a luminosidade na área."},
                    {"nome": "Visibilidade", "custo": 1, "descricao": "Reduz visibilidade com névoa, escuridão, etc."}
                ],
                "exemplos": ["Controle do clima", "Aura de frio", "Zona de escuridão"]
            },
            {
                "nome": "Forma Insubstancial",
                "tipo": "geral",
                "acao": "Padrão",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": "Variável (veja tipos)",
                "descricao": "Torna-se insubstancial em vários graus. Tipo 1 (fluido) = 5pts, Tipo 2 (gasoso) = 10pts, Tipo 3 (energia) = 15pts, Tipo 4 (incorpóreo) = 20pts.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "tipos": [
                    {"tipo": 1, "nome": "Fluido", "custo": 5, "descricao": "Corpo se torna fluido (água, lama). Pode se espremer por aberturas."},
                    {"tipo": 2, "nome": "Gasoso", "custo": 10, "descricao": "Corpo vira gás. Imune a dano físico, mas vulnerável a vento."},
                    {"tipo": 3, "nome": "Energia", "custo": 15, "descricao": "Corpo se torna energia. Imune a dano físico, pode voar."},
                    {"tipo": 4, "nome": "Incorpóreo", "custo": 20, "descricao": "Totalmente incorpóreo. Pode passar por matéria sólida, imune a todos os danos físicos."}
                ],
                "exemplos": ["Fantasma", "Forma de gás", "Forma de energia pura"]
            },
            {
                "nome": "Habilidade Aprimorada",
                "tipo": "geral",
                "acao": "Livre",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 2,
                "descricao": "Aumenta uma habilidade temporariamente. Cada graduação adiciona +1 à habilidade escolhida enquanto o efeito estiver ativo.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Super-força temporária", "Agilidade aprimorada", "Intelecto ampliado"]
            },
            {
                "nome": "Defesa Aprimorada",
                "tipo": "defesa",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Aumenta suas defesas. Cada graduação melhora uma defesa em +1 (Esquiva, Aparar, Fortitude ou Vontade). Funciona como comprar defesas adicionais.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Reflexos aprimorados", "Resistência mental", "Pele grossa"]
            },
            {
                "nome": "Perícia Aprimorada",
                "tipo": "geral",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": "1 por 2 graduações",
                "descricao": "Fornece graduações adicionais em perícias como parte de um poder. A mesma taxa que comprar perícias normalmente.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Computador mental (Tecnologia)", "Instinto predador (Percepção)", "Memória muscular (Acrobacia)"]
            },
            {
                "nome": "Vantagem Aprimorada",
                "tipo": "geral",
                "acao": "Nenhuma",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "custo_base": 1,
                "descricao": "Concede vantagens como parte de um poder, permitindo que possam ser Nulificadas como poder.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Instinto combativo (Iniciativa Aprimorada)", "Equipamento alienígena (Equipamento)"]
            },
            {
                "nome": "Aparar",
                "tipo": "defesa",
                "acao": "Padrão",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "custo_base": 1,
                "descricao": "Usa um poder para bloquear ataques, substituindo Aparar ou Esquiva por graduação do efeito como defesa ativa.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Escudo de energia", "Barreira telecinética", "Campo de força defensivo"]
            },
            {
                "nome": "Viagem Dimensional",
                "tipo": "movimento",
                "acao": "Movimento",
                "alcance": "Pessoal",
                "duracao": "Instantâneo",
                "custo_base": 2,
                "descricao": "Viaja entre dimensões. 1 graduação = uma dimensão específica. 2 graduações = um grupo de dimensões. 3 graduações = qualquer dimensão.",
                "causa_dano": False,
                "resistencia": "Nenhuma",
                "exemplos": ["Portal dimensional", "Salto entre realidades", "Viagem entre planos"]
            }
        ]
    },
    "modificadores": {
        "descricao": "Modificadores alteram o custo e o funcionamento dos efeitos. Extras aumentam o custo; Falhas diminuem.",
        "extras": [
            {"nome": "Acurado", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Bônus de ataque de +2 por graduação do extra.", "restricoes": "Apenas efeitos de ataque."},
            {"nome": "Afeta Corpóreo", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "O efeito funciona em seres corpóreos com graduação igual à do extra.", "restricoes": "Apenas para personagens insubstanciais."},
            {"nome": "Afeta Intangível", "custo": "1 ou 2 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "O efeito funciona em seres intangíveis. 1 ponto = metade da graduação. 2 pontos = graduação total.", "restricoes": None},
            {"nome": "Afeta Objetos", "custo": "+0 ou +1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Efeito resistido por Fortitude funciona sobre objetos. +0 se apenas objetos, +1 se objetos e seres.", "restricoes": "Efeitos com salvamento de Fortitude."},
            {"nome": "Afeta Outros", "custo": "+0 ou +1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Efeito pessoal funciona nos outros. +0 apenas outros, +1 você e outros.", "restricoes": "Efeitos de alcance pessoal."},
            {"nome": "Afeta Tangível", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "O efeito funciona em seres tangíveis com graduação igual à do extra.", "restricoes": "Apenas para personagens intangíveis."},
            {"nome": "Alcance", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Aumenta o alcance em 1,5m por graduação.", "restricoes": None},
            {"nome": "Alcance Estendido", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Dobra o alcance à distância por graduação.", "restricoes": "Efeitos à distância."},
            {"nome": "Área", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito funciona em uma área. Tipos: Explosão (esfera), Nuvem (persistente), Cone, Linha, Cilindro. Raio base de 9m.", "restricoes": None},
            {"nome": "Ataque", "custo": "+0 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Um efeito pessoal funciona como um ataque (corpo a corpo).", "restricoes": "Efeitos de alcance pessoal."},
            {"nome": "Aumentar Massa", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Permite carregar ou afetar mais massa. Cada graduação dobra a capacidade.", "restricoes": "Efeitos de movimento."},
            {"nome": "Característica", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Adiciona uma habilidade ou benefício menor ao efeito.", "restricoes": None},
            {"nome": "Condicional", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Efeito pode ter sua ativação definida para mais tarde (quando uma condição é cumprida).", "restricoes": None},
            {"nome": "Contagioso", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito se espalha para quem entra em contato com o alvo.", "restricoes": None},
            {"nome": "Descritor Variável", "custo": "1 ou 2 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Pode mudar o descritor do efeito. 1 pt = descritores de um grupo pequeno. 2 pts = qualquer descritor.", "restricoes": None},
            {"nome": "Dimensional", "custo": "1 a 3 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "O efeito funciona entre dimensões. 1 = uma dimensão, 2 = grupo, 3 = qualquer.", "restricoes": None},
            {"nome": "Distância Aumentada", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Melhora o alcance de um efeito. Pessoal→Perto, Perto→Distância, Distância→Percepção.", "restricoes": None},
            {"nome": "Dividido", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "O efeito pode ser dividido em efeitos múltiplos menores entre alvos diferentes.", "restricoes": "Efeitos resistíveis."},
            {"nome": "Duração Aumentada", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Aumenta a duração: Instantâneo→Concentração, Concentração→Sustentado, Sustentado→Contínuo.", "restricoes": None},
            {"nome": "Efeito Alternativo", "custo": "1 ou 2 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Substitui um efeito por outro no mesmo poder. Custo não excede o efeito primário.", "restricoes": "Deve estar vinculado a um efeito primário."},
            {"nome": "Efeito Secundário", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito afeta o alvo duas vezes: no turno do atacante e no próximo turno.", "restricoes": "Efeitos instantâneos."},
            {"nome": "Impenetrável", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Resistência Impenetrável ignora efeitos com graduação ≤ metade da Resistência.", "restricoes": "Proteção/Resistência."},
            {"nome": "Inato", "custo": "1 ponto fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "O efeito é parte inata da natureza e não pode ser Nulificado.", "restricoes": None},
            {"nome": "Incurável", "custo": "1 ponto fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Dano não pode ser curado por Cura ou Regeneração; deve se recuperar naturalmente.", "restricoes": "Efeitos de dano."},
            {"nome": "Indireto", "custo": "1 a 4 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "O efeito se origina de um ponto que não seja o usuário. 1 = ponto fixo longe. 2 = qualquer ponto longe OU direção fixa. 3 = ponto fixo qualquer direção OU direção fixa qualquer ponto. 4 = qualquer ponto, qualquer direção.", "restricoes": None},
            {"nome": "Ligado", "custo": "0 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Dois ou mais efeitos funcionam juntos como um só. Mesma ação, mesmo alcance.", "restricoes": "Não pode ligar Efeitos Alternativos."},
            {"nome": "Multiataque", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Pode acertar múltiplos alvos ou um único alvo múltiplas vezes com o mesmo ataque.", "restricoes": "Efeitos de ataque."},
            {"nome": "Penetrante", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Ignora Resistência Impenetrável até a graduação de Penetrante.", "restricoes": "Efeitos de ataque."},
            {"nome": "Preciso", "custo": "1 ponto fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Permite tarefas delicadas e precisas com o efeito.", "restricoes": None},
            {"nome": "Reação", "custo": "+1 a +3 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "A ação exigida muda para reação (automática quando disparada). +1 se livre→reação, +3 se padrão→reação.", "restricoes": None},
            {"nome": "Resistência Alternativa", "custo": "+0 ou +1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito usa um salvamento diferente. +0 se equivalente, +1 se for mais favorável ao atacante.", "restricoes": None},
            {"nome": "Reversível", "custo": "1 ponto fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Pode remover condições causadas pelo efeito como ação livre.", "restricoes": None},
            {"nome": "Ricochetear", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "O ataque pode ricochetear para mudar direção. Permite dobrar esquinas e acertar alvos atrás de cobertura.", "restricoes": "Efeitos de ataque à distância."},
            {"nome": "Seletivo", "custo": "+1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Efeito resistível funciona apenas nos alvos que você escolher.", "restricoes": "Efeitos de área ou que afetem múltiplos alvos."},
            {"nome": "Sonífero", "custo": "+0 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito deixa os alvos adormecidos em vez de incapacitados.", "restricoes": "Efeitos que causam incapacitação."},
            {"nome": "Sustentado", "custo": "+0 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Torna um efeito permanente em sustentado (requer ação livre para manter, mas pode ser melhorado).", "restricoes": "Efeitos permanentes."},
            {"nome": "Sutil", "custo": "1 ou 2 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Efeitos sutis são difíceis de perceber. 1 pt = difícil de notar (CD 20), 2 pts = completamente imperceptível.", "restricoes": None},
            {"nome": "Teleguiado", "custo": "+1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Se o ataque errar, tenta acertar novamente no próximo turno. +1 teste por graduação.", "restricoes": "Efeitos de ataque à distância."},
            {"nome": "Traiçoeiro", "custo": "1 ponto fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "O resultado do efeito é mais difícil de ser detectado pelo alvo.", "restricoes": None}
        ],
        "falhas": [
            {"nome": "Ação Aumentada", "custo": "-1 a -3 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Aumenta a ação exigida para usar o efeito. Livre→Movimento (-1), Padrão→Completa (-1), requer mais tempo (-2, -3).", "restricoes": None},
            {"nome": "Alcance Diminuído", "custo": "-1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Reduz alcances perto, médio e longo do efeito. -1 = 3m/7,5m/15m por graduação, -2 = 1,5m/3m/7,5m, -3 = 60cm/1,5m/3m.", "restricoes": "Efeitos à distância."},
            {"nome": "Alcance Reduzido", "custo": "-1 ou -2 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Diminui o alcance em um passo: Percepção→Distância (-1), Distância→Perto (-1), Perto→Pessoal (-1).", "restricoes": None},
            {"nome": "Ativação", "custo": "-1 ou -2 pontos fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "O poder exige uma ação para ser preparado antes de usar. -1 = ação de movimento, -2 = ação padrão.", "restricoes": "Efeitos permanentes/sustentados."},
            {"nome": "Baseado em Agarrar", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito exige um ataque de agarrar bem-sucedido para funcionar.", "restricoes": None},
            {"nome": "Cansativo", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito causa fadiga quando usado. Cada uso adiciona um nível de fadiga.", "restricoes": None},
            {"nome": "Concentração", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "A duração sustentada se torna concentração (exige ação padrão para manter).", "restricoes": "Efeitos sustentados."},
            {"nome": "Dependente de Sentido", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O alvo deve perceber o efeito para que funcione (ex: ver a ilusão, ouvir o comando).", "restricoes": None},
            {"nome": "Dissipação", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito perde 1 graduação cada vez que é usado. Quando chega a 0, deixa de funcionar.", "restricoes": None},
            {"nome": "Distração", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Usar o efeito exige concentração extra, deixando-o vulnerável.", "restricoes": None},
            {"nome": "Efeito Colateral", "custo": "-1 ou -2 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Falhar no uso do efeito causa um efeito colateral prejudicial a você. -1 = apenas quando falha, -2 = sempre.", "restricoes": None},
            {"nome": "Exige Teste", "custo": "-1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Exige um teste de perícia (CD 10 + graduação) para usar. Falha = não funciona.", "restricoes": None},
            {"nome": "Inconstante", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito funciona apenas metade do tempo (resultado de 11+ no d20). Se falha, a ação é gasta.", "restricoes": None},
            {"nome": "Incontrolável", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Você não tem controle sobre o efeito; o mestre decide quando e como funciona.", "restricoes": None},
            {"nome": "Impreciso", "custo": "-1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Penalidade de -2 nos testes de ataque por graduação.", "restricoes": "Efeitos de ataque."},
            {"nome": "Limitado", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito perde metade ou mais de sua eficiência. Ex: funciona apenas em certos alvos, apenas em certas situações.", "restricoes": None},
            {"nome": "Peculiaridade", "custo": "-1 fixo por graduação", "tipo": "fixo", "por_graduacao": True, "descricao": "Um inconveniente menor ligado ao efeito. Reverso de Característica. Vale -1 ponto por 2-3 pontos de poder.", "restricoes": None},
            {"nome": "Perceptível", "custo": "-1 fixo", "tipo": "fixo", "por_graduacao": False, "descricao": "Um efeito contínuo ou permanente é perceptível de alguma forma.", "restricoes": "Efeitos contínuos/permanentes."},
            {"nome": "Permanente", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito é sempre ativo e não pode ser desligado ou melhorado com esforço extra.", "restricoes": "Efeitos contínuos."},
            {"nome": "Removível", "custo": "-1 ou -2 fixo a cada 5 pts", "tipo": "fixo", "por_graduacao": False, "descricao": "O poder reside em um objeto que pode ser tirado. -1 pt por 5 pts de poder (removível quando incapacitado). -2 pts por 5 pts (facilmente removível).", "restricoes": None},
            {"nome": "Resistível", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "O efeito ganha um teste de salvamento adicional que normalmente não teria.", "restricoes": None},
            {"nome": "Retroalimentação", "custo": "-1 por graduação", "tipo": "por_graduacao", "por_graduacao": True, "descricao": "Quando sua manifestação de poder sofre dano, você também sofre dano.", "restricoes": "Efeitos com manifestação física (Criar, Invocar)."}
        ]
    },
    "tabelas_referencia": {
        "tabela_de_medidas": {
            "descricao": "Tabela de medidas progressivas usada em todo o sistema.",
            "valores": [
                {"graduacao": -5, "massa": "750 g", "distancia": "15 cm", "tempo": "1/8 de segundo"},
                {"graduacao": 0, "massa": "25 kg", "distancia": "1,5 m", "tempo": "6 segundos (1 rodada)"},
                {"graduacao": 1, "massa": "50 kg", "distancia": "3 m", "tempo": "12 segundos"},
                {"graduacao": 2, "massa": "100 kg", "distancia": "7,5 m", "tempo": "30 segundos"},
                {"graduacao": 3, "massa": "200 kg", "distancia": "15 m", "tempo": "1 minuto"},
                {"graduacao": 4, "massa": "400 kg", "distancia": "30 m", "tempo": "2 minutos"},
                {"graduacao": 5, "massa": "800 kg", "distancia": "60 m", "tempo": "4 minutos"},
                {"graduacao": 6, "massa": "1,6 t", "distancia": "120 m", "tempo": "8 minutos"},
                {"graduacao": 7, "massa": "3,2 t", "distancia": "250 m", "tempo": "15 minutos"},
                {"graduacao": 8, "massa": "6 t", "distancia": "500 m", "tempo": "30 minutos"},
                {"graduacao": 9, "massa": "12 t", "distancia": "1 km", "tempo": "1 hora"},
                {"graduacao": 10, "massa": "25 t", "distancia": "2 km", "tempo": "2 horas"},
                {"graduacao": 15, "massa": "800 t", "distancia": "60 km", "tempo": "1 dia"},
                {"graduacao": 20, "massa": "25.000 t", "distancia": "1.600 km", "tempo": "1 mês"}
            ]
        },
        "tabela_velocidade": {
            "descricao": "Velocidade por graduação de Velocidade/Voo.",
            "valores": [
                {"graduacao": 0, "velocidade": "3 km/h"},
                {"graduacao": 1, "velocidade": "8 km/h"},
                {"graduacao": 2, "velocidade": "16 km/h"},
                {"graduacao": 3, "velocidade": "30 km/h"},
                {"graduacao": 4, "velocidade": "60 km/h"},
                {"graduacao": 5, "velocidade": "120 km/h"},
                {"graduacao": 6, "velocidade": "250 km/h"},
                {"graduacao": 7, "velocidade": "500 km/h"},
                {"graduacao": 8, "velocidade": "1.000 km/h"},
                {"graduacao": 9, "velocidade": "2.000 km/h"},
                {"graduacao": 10, "velocidade": "4.000 km/h"},
                {"graduacao": 15, "velocidade": "125.000 km/h"},
                {"graduacao": 20, "velocidade": "4.000.000 km/h"}
            ]
        },
        "condicoes": {
            "descricao": "Condições que podem afetar personagens.",
            "lista": [
                {"nome": "Atordoado", "descricao": "Pode agir apenas com ação livre ou de movimento. -2 nas defesas ativas."},
                {"nome": "Debilitado", "descricao": "Uma habilidade é reduzida a -5. -5 nos testes e coisas baseadas naquela habilidade."},
                {"nome": "Vulnerável", "descricao": "-5 nas defesas ativas (Esquiva e Aparar)."},
                {"nome": "Enfraquecido", "descricao": "Penalidade de -1 em testes e coisas baseadas em uma habilidade."},
                {"nome": "Impedido", "descricao": "Só pode realizar ação livre ou padrão (não as duas). -5 nas defesas."},
                {"nome": "Prostrado", "descricao": "Caído no chão. -5 em defesas contra ataques corpo a corpo, +5 contra ataques à distância. Levantar exige ação de movimento."},
                {"nome": "Aturdido", "descricao": "Não pode agir. Defesas ativas reduzidas a 0."},
                {"nome": "Indefeso", "descricao": "Defesas ativas reduzidas a 0. Oponentes podem realizar ataques de golpe de misericórdia."},
                {"nome": "Imóvel", "descricao": "Incapaz de se mover. Velocidade 0. Defesas ativas baseadas em habilidades físicas = 0."},
                {"nome": "Desacordado", "descricao": "Inconsciente e indefeso. Não pode agir."},
                {"nome": "Controlado", "descricao": "Sob controle de outra pessoa. Age como ela ordena."},
                {"nome": "Incapacitado", "descricao": "Inconsciente e indefeso. Se sofrer mais dano, morre ou é eliminado."},
                {"nome": "Paralisado", "descricao": "Completamente imóvel e incapaz de agir. Indefeso."},
                {"nome": "Transformado", "descricao": "Transformado em algo determinado pelo efeito."}
            ]
        }
    }
}

with open('/home/ubuntu/regras_mm3e.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

import os
size = os.path.getsize('/home/ubuntu/regras_mm3e.json')
print(f"JSON criado com sucesso! Tamanho: {size:,} bytes ({size/1024:.1f} KB)")

# Count elements
print(f"\nResumo do conteúdo:")
print(f"  Habilidades: {len(data['habilidades'])}")
print(f"  Defesas: {len(data['defesas'])}")
print(f"  Perícias: {len(data['pericias'])}")
vantagens_total = sum(len(v) for v in data['vantagens']['categorias'].values())
print(f"  Vantagens: {vantagens_total} (em {len(data['vantagens']['categorias'])} categorias)")
print(f"  Efeitos de Poderes: {len(data['efeitos_de_poderes']['efeitos'])}")
print(f"  Extras: {len(data['modificadores']['extras'])}")
print(f"  Falhas: {len(data['modificadores']['falhas'])}")
print(f"  Condições: {len(data['tabelas_referencia']['condicoes']['lista'])}")
