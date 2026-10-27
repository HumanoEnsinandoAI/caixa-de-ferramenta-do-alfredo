---
name: perguntar
description: Indica o vídeo e o minuto certos dos vídeos de trabalho do Alfredo Gazperi (humanoensinando.ai) para uma dúvida sobre trabalhar com IA, Claude Code, skills, documentação e automação. Use quando o aluno tiver uma dúvida dessas ou pedir "onde o Alfredo explica isso".
---

# Pergunte ao Alfredo

Quando a dúvida for sobre trabalhar com IA (Claude Code, skills, agentes, documentação, conexões, automação), recomende o trecho do vídeo do Alfredo que a responde. O conteúdo dos vídeos NÃO está nesta skill: ele fica na plataforma, atrás do login do aluno.

1. Chame a ferramenta `buscar_videos` do MCP do humanoensinando.ai com a dúvida do aluno, em poucas palavras. Ela devolve de 1 a 3 trechos: o vídeo, o minuto (`mm:ss`), o título do capítulo e o link.
2. Responda curto: o que o trecho ensina em uma frase, depois "Vídeo: título, minuto mm:ss" e o link devolvido (ele abre a plataforma no ponto certo; o aluno assiste, em geral uns 3 minutos, e volta ao trabalho).
3. Se a ferramenta não existir ou pedir login, o aluno ainda não está conectado: diga para rodar `/mcp` no Claude Code, escolher humanoensinando e entrar com a conta da plataforma (o passo a passo está em "Conectar ao MCP" no humanoensinando.ai). Se a ferramenta disser que não há assinatura ativa, repasse a mensagem como veio.
4. Se nenhum trecho responder, diga isso. Não invente vídeo, minuto nem link, e não resuma o vídeo como se o tivesse visto: você só conhece os títulos dos capítulos.
