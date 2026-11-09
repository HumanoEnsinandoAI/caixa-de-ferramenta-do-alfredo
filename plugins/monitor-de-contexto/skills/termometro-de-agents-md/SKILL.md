---
name: termometro-de-agents-md
description: Verifica se os AGENTS.md e CLAUDE.md do projeto estão bem escritos e quanto pesam na janela de contexto, com nota de 0 a 5 e propostas de divisão, unificação ou exemplos, sem aplicar nada. Use quando alguém perguntar se esses arquivos estão bons, grandes demais ou bem organizados, ou pedir para revisá-los, enxugá-los, dividi-los ou unificá-los; e logo depois que você criar ou reescrever um deles. Não use para outros arquivos .md nem a cada edição pequena.
user-invocable: false
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/sinais.py *) Bash(py -3 ${CLAUDE_SKILL_DIR}/scripts/sinais.py *)
---

# Termômetro de AGENTS.md

Verifica os arquivos de instrução de agentes do projeto. O conteúdo deles entra na janela de contexto, por isso a verificação existe. A skill lê e relata, e propõe mudanças. Não edita nenhum arquivo sem aprovação explícita do usuário.

- Scripts: `${CLAUDE_SKILL_DIR}/scripts/sinais.py`, só biblioteca padrão. Imprime JSON com pistas.
- Critérios: `${CLAUDE_SKILL_DIR}/reference/criterios.md`. Leia antes de pontuar.

Rode os scripts na pasta de trabalho atual, sem `cd`. No Windows, use `py -3` no lugar de `python3`.

## Etapa 0: relatório do /doctor

Antes de tudo, peça ao usuário para rodar `/doctor prompt-audit` no Claude Code, se ele ainda não rodou. Esse comando é da própria Anthropic: verifica CLAUDE.md, CLAUDE.local.md, AGENTS.md e skills em busca de instruções desatualizadas, conflitantes e referências quebradas. Ele pode gerar CLAUDE.md novos, e tudo bem: esta skill vem depois e ajusta esses pontos.

Se o usuário trouxer o relatório, use-o. O que ele já cobre sai da conta dos critérios 7 e, nas linhas de árvore, do 4. Se não houver relatório, siga a análise sem ele e diga que o `/doctor` não foi rodado.

## Etapa 1: listar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/sinais.py listar
```

Mostra cada arquivo com linhas, caracteres e `quando_carrega` (no início, sob demanda ou ignorado), e os CLAUDE.md que bloqueiam o AGENTS.md. Se a lista estiver vazia, diga isso e pare.

## Etapa 2: entender o projeto

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/sinais.py projeto
```

Diz se o projeto é de desenvolvimento, quais comandos existem, quais alvos são de verificação e quais arquivos de pronto há. Esses dados decidem os critérios 2 e 5. Se o projeto não for de código, confirme pela leitura e marque esses critérios como N/A.

## Etapa 3: verificar cada arquivo

Para cada arquivo:

1. Rode `python3 ${CLAUDE_SKILL_DIR}/scripts/sinais.py arquivo CAMINHO`.
2. Leia o arquivo inteiro.
3. Se `quando_carrega` for "ignorado", pontue só o critério 6. Os demais não valem para um arquivo que não carrega.
4. Senão, avalie os nove critérios de `reference/criterios.md`. Dois são críticos: tamanho (1) e segredos (8).
5. Critério que não se aplica sai da conta. A nota é `round(5 × cumpridos ÷ aplicáveis)`, com 0,5 arredondado para cima.

Os sinais do script são pistas. Quando um sinal e a leitura divergirem, siga a leitura e diga por quê. Um exemplo só é exigido se o agente precisar de um formato. Não é exigido para regras simples.

## Etapa 4: apresentar

Tabela do pior para o melhor, com as colunas: arquivo, linhas, nota e problemas. Em problemas, uma linha por critério que falhou. Cores:

- 0 e 1: 🟥 vermelho
- 2: 🟧 laranja
- 3: 🟨 amarelo
- 4 e 5: 🟩 verde

Escreva a nota como `🟩 4/5`. Se o arquivo tiver falha crítica, a célula fica `🟥 crítico 4/5`, e a cor fica vermelha mesmo com nota alta. Depois da tabela, diga em uma frase quais arquivos são críticos.

## Etapa 5: propor, sem aplicar

Para cada falha, mostre o trecho original e o resultado esperado. Não altere nada até o usuário aprovar.

- **CLAUDE.md que bloqueia o AGENTS.md:** a decisão é de análise, caso a caso. Não há regra fixa de apagar. Olhe o conteúdo:
  - CLAUDE.md que só importa `@AGENTS.md` ou é link para ele não bloqueia; nada a propor.
  - CLAUDE.md com conteúdo próprio, versionado: proponha unificar em AGENTS.md e apagar o CLAUDE.md.
  - CLAUDE.local.md, de uso pessoal: não una ao AGENTS.md versionado, porque vazaria notas privadas. Proponha ajustar a precedência, por exemplo movendo o que é de todos para o AGENTS.md e deixando só o pessoal no local.
- **Exemplo faltando:** proponha um exemplo curto, no ponto do arquivo onde o formato é usado. Se o exemplo passar de 30 linhas, proponha um `.md` separado, referenciado no texto.
- **Arquivo acima de 200 linhas ou de 20.000 caracteres, ou com áreas misturadas:** proponha a divisão. Cada trecho vai para um destino:
  - **AGENTS.md dentro da subpasta da área.** Carrega quando o Claude lê um arquivo daquela pasta. Se a subpasta tiver CLAUDE.md, ele bloqueia: avise e proponha tratar isso antes. Pela documentação, o AGENTS.md de subpasta só carrega pela ferramenta Read, e não com um CLAUDE.md acima. Diga isso ao usuário.
  - **Arquivo `.md` separado, referenciado no AGENTS.md.** Para procedimentos longos ou de uma tarefa só. No lugar do trecho fica uma linha com a condição para ler, por exemplo: "Para fazer deploy, leia `deploy.md`".
- **Ruído com árvore de pastas:** troque a árvore por uma linha por pasta, com até 80 caracteres.
- **Critério de pronto existente e não citado:** proponha uma linha citando o comando ou o arquivo.
- **Caminho ou comando que não existe:** proponha corrigir ou remover a linha.
- **Segredo:** avise o usuário sem repetir o valor, e proponha removê-lo e rotacioná-lo.
- **Import que carrega conteúdo só às vezes:** proponha trocar o `@` por uma referência em texto com a condição para ler.

O raiz do AGENTS.md fica com a visão geral curta, os comandos principais, as convenções do projeto inteiro e a definição de pronto.

Formato da proposta:

```text
Arquivo: AGENTS.md (412 linhas)
- Linhas 1 a 40 → ficam (visão geral e comandos)
- Linhas 41 a 120 (deploy) → deploy.md; no lugar: "Para deploy, leia deploy.md"
- Linhas 121 a 200 (frontend) → frontend/AGENTS.md
Resultado esperado: raiz com 60 linhas, cada arquivo novo com menos de 200.
```

Não use `@import` para conteúdo que deve carregar só quando preciso. O import entra junto com o arquivo que o importa, então não reduz o custo.
