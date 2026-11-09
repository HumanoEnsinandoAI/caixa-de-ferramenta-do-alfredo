---
name: orientacoes-sobre-janela-de-contexto
description: Responde perguntas sobre como funciona a janela de contexto e sobre o plugin Monitor de Contexto em si, o que ele mostra, o que as barras e a porcentagem significam, como os níveis e os alertas são calculados e o que fazer quando aparece um aviso. Use quando alguém perguntar como funciona a janela de contexto, o que é o plugin, para que serve, por que a barra mudou de cor ou o que significa um alerta.
---

# Orientações sobre a janela de contexto

Esta skill responde a perguntas sobre a janela de contexto e sobre o plugin Monitor de Contexto. Ela é a única que trata desse assunto.

## Como a janela de contexto funciona

A janela de contexto guarda tudo que o Claude sabe da sessão: suas instruções, os arquivos que ele leu, as respostas dele e conteúdos que não aparecem no terminal.

**Antes de você digitar:** o `CLAUDE.md`, a memória automática, os nomes das ferramentas MCP e as descrições das skills já entram na janela. Em vez do `CLAUDE.md`, pode entrar um `AGENTS.md`. Um estilo de saída ou texto de `--append-system-prompt` também pode somar.

**Enquanto o Claude trabalha:**
- Cada arquivo lido ocupa espaço.
- Regras com `paths:` no frontmatter entram junto com os arquivos que casam com elas.
- Um hook `PostToolUse` pode disparar depois de cada edição.
- Um subagente faz a pesquisa numa janela separada. Só o resumo e um pequeno bloco de metadados voltam para a conversa principal, então leituras grandes não ocupam a sua janela.

**Custo por envio:** cada mensagem sua faz o Claude reler a janela inteira. Por isso o contexto cheio pesa em todo envio, não só no último.

## O que sobrevive à compactação

`/compact` troca o histórico por um resumo estruturado. Depois disso:

- **Continuam valendo:** o prompt do sistema e o estilo de saída.
- **Voltam do disco:** o `CLAUDE.md` da raiz, as regras sem `paths:`, a memória automática e o plano escrito no modo de plano.
- **Voltam atualizadas:** as descrições das skills são reconstruídas a partir das skills atuais.
- **Voltam até cinco arquivos:** os lidos ou editados mais recentemente. Arquivo com mais de 5 mil tokens volta só como referência de caminho.
- **Corpos de skills invocadas:** voltam com teto de 5 mil tokens por skill e 25 mil no total. As mais antigas caem primeiro. Por isso, o começo do `SKILL.md` deve trazer o essencial.
- **Não voltam sozinhos:** regras com `paths:` e `CLAUDE.md` de subpastas. Eles recarregam quando o arquivo gatilho é lido de novo. Se uma regra precisa sobreviver à compactação, tire o `paths:` ou mova a regra para o `CLAUDE.md` da raiz.
- **Perdem-se no resumo:** contexto que hooks adicionaram antes. Ele entra no resumo junto com o resto da conversa.
- **Continuam rodando:** comandos e subagentes em segundo plano. O Claude é lembrado de quais ainda estão ativos, para não iniciar uma duplicata.

## Como agir quando a janela enche

- **Compactação automática:** o Claude Code compacta sozinho ao se aproximar do limite. Uma janela cheia não encerra a sessão.
- **`/compact` com foco:** por exemplo, `/compact foco na correção do bug de autenticação`. O resumo mantém o que você escolheu.
- **`/rewind`:** selecione uma mensagem e use **Summarize from here** ou **Summarize up to here** para compactar só parte da conversa.
- **`/autocompact`:** define com que volume de tokens a compactação automática dispara, por exemplo `/autocompact 500k`.
- **`/clear`:** ao trocar de tarefa, limpe. A conversa antiga ocupa espaço e custa tokens em todo envio.
- **Subagente:** mande pesquisas e leituras grandes para ele.
- **Janela maior:** alguns modelos recentes suportam 1 milhão de tokens. A seleção usa a variante com `[1m]`, e a disponibilidade depende do plano.

Os pontos de compactação automática variam por modelo e configuração. Quando o Claude Code assume a janela errada para um ID de modelo, por exemplo por causa de um gateway, a correção está nas configurações de janela do modelo.

Para ver o uso real da sua sessão, use `/context`. Ele mostra o detalhamento por categoria e quais arquivos de `CLAUDE.md` e de memória carregaram. Para abrir e editar esses arquivos, use `/memory`.

## Sobre o plugin

O Monitor de Contexto mostra, acima do prompt, quanto da janela de contexto da sessão já foi usado. Ele não muda nada na conversa: só mede e avisa. Vem desligado por padrão e pode ser ligado pela interface do Claude Code.

## O que cada parte mostra

- **Barras**: são 10 blocos. Quanto mais cheios, mais contexto usado. A cor acompanha o nível.
- **Porcentagem**: é o `context.percent` que o Claude Code calcula para a janela.
- **Frase de apoio**: em cinza. Sem alerta, ela muda com o nível e com o tamanho dos seus envios. Com alerta, mostra a orientação do aviso.

## Como os níveis são calculados

Os níveis vêm da linha `Messages` do `/context`, não da porcentagem total:

- Um nível a cada 50 mil tokens.
- O teto é 500 mil tokens, que é o nível máximo.

## Como os alertas são calculados

Os alertas usam o total de tokens da janela e a parte de mensagens. Há três faixas:

| Total de tokens | O que acontece |
| --- | --- |
| Até 200 mil | Nada aparece, mesmo com envios curtos. |
| 200 a 250 mil | Aparece o aviso `aproximando` se os três últimos envios forem curtos. |
| 250 a 600 mil | Se a linha `Messages` for pelo menos metade do total: aparece `curta` quando o último envio é curto, senão `atencao`. Se for menos da metade, nada aparece. |
| Acima de 600 mil | Aparece `compactar` sempre, sem olhar a proporção. |

Um envio é **curto** quando tem menos de 30 tokens, o que equivale a cerca de 120 caracteres (4 caracteres por token).

## Limites da medida

- A linha `Messages` junta o que você digita, as respostas do Claude e o que as ferramentas devolvem. Por isso a proporção é uma aproximação do que é mensagem sua.
- Os textos dos alertas são provisórios e podem mudar.

## O que fazer quando aparece um aviso

- `aproximando` e `curta`: junte o que falta num envio só, em vez de mandar várias mensagens pequenas. Cada envio relê a janela inteira.
- `atencao`: quando a tarefa terminar, compacte a conversa.
- `compactar`: compacte agora. Acima de 600 mil tokens a janela já está pesada demais.

Quando o aluno pedir para ver o número exato, use `/context` para conferir o total e a linha `Messages`.
