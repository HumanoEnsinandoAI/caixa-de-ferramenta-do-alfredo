# Humano e sua caixa de ferramentas

O marketplace de plugins do [humanoensinando.ai](https://humanoensinando.ai), do Alfredo Gazperi. Você instala uma vez e passa a receber tudo o que ele publicar aqui no seu agente de IA (Claude Code).

## Instalar

```
claude plugin marketplace add HumanoEnsinandoAI/caixa-de-ferramenta-do-alfredo
```

Para receber as novidades: `claude plugin marketplace update caixa-de-ferramentas-do-alfredo`.

## O que tem aqui

| Plugin | O que faz |
|---|---|
| `monitor-de-contexto` | Mostra acima do prompt quanto da janela de contexto já foi usado, em 4 barras que mudam de cor, com a porcentagem e uma dica. Inclui a skill `agents-md-thermometer`, que o Claude usa sozinho para checar se os AGENTS.md e CLAUDE.md do projeto estão bem escritos. Não precisa de conta. Instale com `claude plugin install monitor-de-contexto@caixa-de-ferramentas-do-alfredo`. |
| `organizador-de-google-agenda` | Organiza o seu Google Agenda pelo Claude: conecta a agenda pelo conector do Claude, aprende o que é pessoal e o que é trabalho, mostra as suas rotinas do Claude Code como eventos livres (nunca ocupados) e pinta os eventos com a paleta que você escolher. Pede para você autorizar o conector, e nunca guarda senhas nem o conteúdo dos eventos. Instale com `claude plugin install organizador-de-google-agenda@caixa-de-ferramentas-do-alfredo`. |

Mais plugins entram aqui com o tempo.

## Problemas conhecidos

### organizador-de-google-agenda

- **Cores dos eventos limitadas a 11.** O Google Agenda agora oferece 24 cores padrão e cores livres, mas o conector do Claude só aceita as 11 cores fixas de antes. Por isso as paletas do plugin têm 3 cores, escolhidas entre essas 11. Quando o conector aceitar as cores novas, o plugin poderá oferecer paletas maiores.

## O que NÃO tem aqui

Este repositório só tem os plugins e as instruções de instalação, sem conteúdo protegido.
