# Critérios detalhados

Cada critério vale um ponto. Antes de pontuar, veja se ele se aplica. Um critério que não se aplica sai da conta (N/A) e não conta como falha.

## Nota

- Aplicáveis: os critérios que não são N/A.
- Cumpridos: quantos deles o arquivo cumpre.
- Nota de 0 a 5: `round(5 × cumpridos ÷ aplicáveis)`, com 0,5 arredondado para cima.
- Crítico: se o critério 1 ou o 8 falhar, a cor é vermelha, mesmo com nota alta.

## 1. Tamanho (crítico)

- Sinais: `linhas`, `caracteres`, `critico_mais_de_200_linhas`, `critico_mais_de_20000_caracteres`.
- Cumpre: até 200 linhas e até 20.000 caracteres. As duas medidas valem, porque poucas linhas longas também pesam.
- Falha crítica: passar de qualquer um dos dois limites. Proponha a divisão (etapa 5 da SKILL).

## 2. Comandos exatos (só projeto de desenvolvimento, só no arquivo raiz)

- N/A: `projeto_de_desenvolvimento` é falso, ou o arquivo está numa subpasta (ele é carregado sob demanda e não é a visão geral).
- Cumpre: traz ao menos um comando de teste e um de build ou lint, escritos como se digitam, e todo comando citado existe. Sinal: `comandos_citados`, com `existe` true, false ou null.
- `existe: null` é uma ferramenta que o script não confere (pytest, go, cargo). Confira pela leitura do projeto.
- Falha: não há comando de teste ou de build, ou algum comando com `existe: false`. "Rode os testes" sozinho não conta.

## 3. Exemplos quando forem necessários

Depende da leitura, não de contagem. Ter um bloco de código não basta.

Um exemplo é necessário quando o agente precisa produzir algo com formato que não se deduz da frase:

- formato de saída, como JSON, tabela ou relatório;
- esquema ou estrutura de arquivo;
- template de commit, de pull request ou de documento;
- convenção de nomes com padrão específico.

Não é necessário quando a instrução é uma regra simples de comportamento, como "não altere arquivos sem perguntar".

- Não precisa de exemplo: cumpre.
- Precisa e tem exemplo: cumpre. Sinal: `blocos_com_pista_de_exemplo`, que só aponta candidatos.
- Precisa e não tem: falha. Proponha um exemplo curto no lugar certo.
- Exemplo longo (`blocos_longos_mais_de_30_linhas`): cumpre, mas proponha mover o exemplo para um `.md` separado, referenciado.

## 4. Sem ruído

Falha se houver qualquer um destes:

- Frases genéricas que não mudam o comportamento, como "escreva código limpo", "siga as boas práticas" ou "clean code". Sinal: `frases_genericas`.
- Árvore de diretórios desenhada com `├──`, `|--` ou similar. Sinal: `linhas_de_arvore`. Árvores ficam desatualizadas.

Pastas são permitidas, com estas regras (sinal: `linhas_de_pasta`):

- Cada pasta em uma linha, com descrição de até 80 caracteres. Exemplo: "`api/`: handlers do servidor".
- No máximo 10 linhas de pastas no arquivo. Se houver mais, a menção fica no AGENTS.md da própria pasta.
- Linha de pasta acima de 80 caracteres: proponha encurtar.

## 5. Critério de pronto (só se o projeto tiver um)

- N/A: `arquivos_de_pronto` e `workflows_ci` vazios. Um Makefile sem alvo de verificação não conta.
- Cumpre: o projeto tem critério de pronto (workflow de CI, alvo de verificação no Makefile, CONTRIBUTING.md, template de pull request, pré-commit) e o arquivo o cita pelo nome ou pelo comando.
- Falha: o projeto tem esse critério, mas o arquivo não o menciona. Proponha uma linha citando o comando ou o arquivo.

## 6. Arquivo que carrega (precedência)

- N/A: a pasta não tem CLAUDE.md. Com só AGENTS.md, este critério cumpre.
- Falha: há CLAUDE.md na pasta. O Claude Code ignora o AGENTS.md quando há CLAUDE.md na pasta de trabalho ou acima, e o CLAUDE.md duplica o conteúdo. Proponha unificar em AGENTS.md e apagar o CLAUDE.md, com aprovação.
- Sinal: `quando_carrega` (ignorado, no início ou sob demanda). A pista vem da precedência pela pasta de trabalho. Confirme na documentação se houver dúvida.

## 7. Referências vivas

- N/A: o arquivo não cita caminhos nem comandos.
- Cumpre: todo caminho em crase (`referencias_de_caminho`) existe, e todo comando (`comandos_citados`) existe ou é null.
- Falha: algum caminho com `existe: false`, ou comando com `existe: false`. Proponha corrigir ou remover a linha.

## 8. Sem segredos (crítico)

- Sinal: `segredos_suspeitos`. O script nunca imprime o valor.
- Cumpre: nenhum segredo, chave ou senha em texto.
- Falha crítica: qualquer segredo. Avise o usuário sem repetir o valor, e proponha removê-lo e rotacioná-lo.

## 9. Imports com `@`

- N/A: o arquivo não tem `@` apontando para arquivo (`importacoes` vazio).
- Cumpre: cada import aponta para arquivo que existe, com até 20.000 caracteres, e o conteúdo importado é necessário em toda sessão.
- Falha: import quebrado, import acima de 20.000 caracteres, ou conteúdo só às vezes necessário carregado por `@`. Proponha trocar por referência em texto com a condição para ler. O import não reduz o custo: ele entra junto com o arquivo que o importa.

## Cores

- 0 e 1: 🟥 vermelho
- 2: 🟧 laranja
- 3: 🟨 amarelo
- 4 e 5: 🟩 verde
- Crítico (critério 1 ou 8): 🟥 vermelho, com a marca `crítico`.
