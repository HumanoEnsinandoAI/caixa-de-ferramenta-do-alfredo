#!/usr/bin/env python3
"""Sinais determinísticos para o termômetro de AGENTS.md.

Só a biblioteca padrão. Imprime JSON com pistas; o julgamento é do Claude,
seguindo reference/criterios.md. Pista não é veredito: quando a leitura do
arquivo divergir do sinal, vale a leitura.

Uso, sempre a partir da raiz do projeto:
  python3 sinais.py listar                 arquivos de instrução, onde e quando cada um carrega
  python3 sinais.py projeto                se é projeto de desenvolvimento, comandos e arquivos de pronto
  python3 sinais.py arquivo CAMINHO        sinais de um arquivo
"""
import json
import os
import re
import sys

NOMES = {"AGENTS.md", "CLAUDE.md", "CLAUDE.local.md"}
TIPOS_CLAUDE = {"CLAUDE.md", "CLAUDE.local.md"}
IGNORAR = {"node_modules", ".git", ".venv", "venv", "vendor", "dist", "build", "target",
           ".next", "coverage", "__pycache__"}

LIMITE_LINHAS = 200
LIMITE_CARACTERES = 20_000
LIMITE_BLOCO = 30
LIMITE_LINHA_PASTA = 80
LIMITE_LINHAS_PASTA = 10

# Arquivos que indicam projeto de desenvolvimento (lockfiles incluídos).
MARCADORES_DEV = [
    "package.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "package-lock.json",
    "pyproject.toml", "setup.py", "requirements.txt", "go.mod", "Cargo.toml", "pom.xml",
    "build.gradle", "Gemfile", "Makefile", "Dockerfile", "pubspec.yaml", "composer.json",
    "CMakeLists.txt", ".github/workflows",
]

# Alvos que contam como verificação. Um Makefile sem eles não torna o critério 5 aplicável.
ALVOS_DE_VERIFICACAO = {"test", "tests", "check", "lint", "ci", "verify"}

# Critérios de pronto do projeto. Makefile entra só se tiver alvo de verificação.
ARQUIVOS_DE_PRONTO = [
    ".github/workflows", ".github/pull_request_template.md", "CONTRIBUTING.md",
    ".pre-commit-config.yaml", ".husky",
]

# Comandos de instalação e de scripts padrão que não aparecem em "scripts" do package.json.
BUILTIN_PM = {
    "npm install", "npm i", "npm ci", "npm test", "npm start", "npm stop", "npm restart",
    "pnpm install", "pnpm i", "yarn install", "bun install",
}

FRASES_GENERICAS = [
    "escreva código limpo", "código limpo", "siga as boas práticas", "boas práticas",
    "use nomes descritivos", "nomes descritivos", "seja claro", "mantenha o código simples",
    "clean code", "best practices", "descriptive names", "write clean code",
]

# Padrões de segredo. O valor nunca é impresso, só o tipo e a linha.
SEGREDOS = [
    ("chave da Anthropic", re.compile(r"sk-ant-[A-Za-z0-9_-]{10,}")),
    ("chave da OpenAI", re.compile(r"sk-[A-Za-z0-9]{20,}")),
    ("chave AWS", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("token do GitHub", re.compile(r"(ghp_|github_pat_)[A-Za-z0-9_]{20,}")),
    ("chave privada", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("senha ou token em texto", re.compile(r"(?i)\b(password|passwd|senha|secret|api[_-]?key|token)\s*[:=]\s*\S{6,}")),
]

# Árvore de diretórios: ├── └── │──, a versão ASCII do tree e o formato "+--".
ARVORE = re.compile(r"^\s*(?:[├└│]\s?──|[├└│]─|\|\s?--(?!-)|`--|\+--)\s*\S")
TITULO_EXEMPLO = re.compile(r"^#{1,6}\s*(exemplos?|examples?)\b", re.IGNORECASE)
PALAVRA_EXEMPLO = re.compile(r"\b(exemplos?|examples?)\b", re.IGNORECASE)
CERCA = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
COMANDO_PM = re.compile(r"^(npm|pnpm|yarn|bun|make)\b")
COMANDO_OUTRO = re.compile(r"^(pytest|uv|ruff|go|cargo|mvn|gradle|tsc|eslint|vitest|jest)\b")
PASTA_CRASE = re.compile(r"`[\w.\-]+/[\w./\-]*`")
PASTA_SOLTA = re.compile(r"(?<![\w/])[\w.\-]+/(?=[\s`,.;:)]|$)")
PALAVRA_PASTA = re.compile(r"\b(pastas?|diret[óo]rios?|folders?|director(?:y|ies))\b", re.IGNORECASE)
REF_CAMINHO = re.compile(r"`([\w.\-]+(?:/[\w.\-]+)*\.[A-Za-z0-9]{1,5}|[\w.\-]+/[\w.\-/]*)`")
IMPORTACAO = re.compile(r"(?<![\w`@.])@((?:\.{0,2}/|~/)?[\w@.~/-]*[\w])")


def ler(caminho):
    """Linhas do arquivo. Mesmo método em todos os modos, para as contagens baterem."""
    with open(caminho, encoding="utf-8-sig", errors="replace") as f:
        return f.read().splitlines()


def cadeia(raiz):
    """A pasta de trabalho e todas as de cima, até a raiz do sistema."""
    pastas, atual = [], os.path.realpath(raiz)
    while True:
        pastas.append(atual)
        pai = os.path.dirname(atual)
        if pai == atual:
            return pastas
        atual = pai


def claude_md_na_cadeia(raiz):
    achados = []
    for pasta in cadeia(raiz):
        for candidato in ("CLAUDE.md", "CLAUDE.local.md", os.path.join(".claude", "CLAUDE.md")):
            caminho = os.path.join(pasta, candidato)
            if os.path.isfile(caminho):
                achados.append(caminho)
    return achados


def onde_carrega(caminho, raiz, cadeia_claude):
    """Pista de quando o Claude Code lê o arquivo. Confirme na documentação se houver dúvida."""
    real = os.path.realpath(caminho)
    # Um CLAUDE.md que é link para este mesmo arquivo não conta como outro arquivo.
    tem_claude_md = any(os.path.realpath(c) != real for c in cadeia_claude)
    pasta = os.path.dirname(real)
    if os.path.basename(pasta) == ".claude":
        pasta = os.path.dirname(pasta)
    no_inicio = pasta in set(cadeia(raiz))

    if os.path.basename(caminho) == "AGENTS.md":
        if not no_inicio:
            return "sob demanda"
        if tem_claude_md:
            return "ignorado: há CLAUDE.md na pasta de trabalho ou acima"
        return "no início"
    return "no início" if no_inicio else "sob demanda"


def listar(raiz):
    achados = []
    for dp, dn, fn in os.walk(raiz):
        dn[:] = [d for d in dn if d not in IGNORAR]
        if os.path.basename(dp) == ".claude" and "worktrees" in dn:
            dn.remove("worktrees")
        for nome in fn:
            if nome in NOMES:
                achados.append(os.path.join(dp, nome))

    cadeia_claude = claude_md_na_cadeia(raiz)
    itens, vistos = [], set()
    # Arquivos de verdade primeiro; um link simbólico para o mesmo conteúdo é ignorado.
    for caminho in sorted(achados, key=lambda c: (os.path.islink(c), c)):
        real = os.path.realpath(caminho)
        if real in vistos:
            continue
        vistos.add(real)
        linhas = ler(caminho)
        item = {
            "caminho": os.path.relpath(caminho, raiz).replace(os.sep, "/"),
            "tipo": os.path.basename(caminho),
            "linhas": len(linhas),
            "caracteres": len("\n".join(linhas)),
            "quando_carrega": onde_carrega(caminho, raiz, cadeia_claude),
        }
        if os.path.islink(caminho):
            item["link_para"] = os.path.relpath(real, raiz).replace(os.sep, "/")
        itens.append(item)

    return {
        "pasta_de_trabalho": os.path.realpath(raiz),
        "claude_md_na_cadeia": cadeia_claude,
        "arquivos": itens,
    }


def projeto(raiz):
    presentes = [m for m in MARCADORES_DEV if os.path.exists(os.path.join(raiz, m))]

    scripts = []
    pacote = os.path.join(raiz, "package.json")
    if os.path.isfile(pacote):
        try:
            with open(pacote, encoding="utf-8") as f:
                scripts = list((json.load(f).get("scripts") or {}).keys())
        except (ValueError, OSError):
            scripts = []

    makefile_nome, alvos = None, []
    for nome in ("Makefile", "makefile", "GNUmakefile"):
        if os.path.isfile(os.path.join(raiz, nome)):
            makefile_nome = nome
            break
    if makefile_nome:
        for linha in ler(os.path.join(raiz, makefile_nome)):
            # "alvo:" seguido de espaço ou fim de linha. Fica de fora "CC := gcc", "X:=1" e "http://".
            m = re.match(r"^([A-Za-z][\w.-]*)\s*:(?=\s|$)", linha)
            if m:
                alvos.append(m.group(1))

    candidatos = set(BUILTIN_PM)
    for nome in scripts:
        candidatos.update({f"npm run {nome}", f"pnpm run {nome}", f"bun run {nome}",
                           f"pnpm {nome}", f"yarn {nome}"})
        # "npm test" equivale a "npm run test"; só os nomes padrão do npm valem sem "run".
        if nome in {"test", "start", "stop", "restart"}:
            candidatos.add(f"npm {nome}")
    candidatos.update(f"make {t}" for t in alvos)

    verificacao = any(t in ALVOS_DE_VERIFICACAO for t in alvos)
    pronto = [a for a in ARQUIVOS_DE_PRONTO if os.path.exists(os.path.join(raiz, a))]
    if makefile_nome and verificacao:
        pronto.append(makefile_nome)

    workflows = []
    pasta_wf = os.path.join(raiz, ".github", "workflows")
    if os.path.isdir(pasta_wf):
        workflows = sorted(os.listdir(pasta_wf))

    return {
        "projeto_de_desenvolvimento": bool(presentes),
        "marcadores": presentes,
        "comandos_candidatos": sorted(candidatos),
        "alvos_de_verificacao": sorted(t for t in alvos if t in ALVOS_DE_VERIFICACAO),
        "arquivos_de_pronto": pronto,
        "workflows_ci": workflows,
    }


def arquivo(caminho, raiz, proj):
    linhas = ler(caminho)
    texto = "\n".join(linhas)

    # Blocos de código cercados por ``` ou ~~~. O fechamento usa o mesmo caractere e tamanho igual ou maior.
    blocos, dentro, aberto = [], [False] * len(linhas), None
    for i, linha in enumerate(linhas):
        if aberto is None:
            m = CERCA.match(linha)
            if m:
                aberto = (i, m.group(1)[0], len(m.group(1)))
            continue
        inicio, caractere, tamanho = aberto
        s = linha.strip()
        if s and set(s) == {caractere} and len(s) >= tamanho:
            blocos.append({"linha": inicio + 1, "tamanho": i - inicio - 1, "fechado": True})
            for j in range(inicio, i + 1):
                dentro[j] = True
            aberto = None
    if aberto is not None:
        inicio = aberto[0]
        blocos.append({"linha": inicio + 1, "tamanho": len(linhas) - inicio - 1, "fechado": False})
        for j in range(inicio, len(linhas)):
            dentro[j] = True

    # Pista de exemplo: título "Exemplo" ou a palavra nas 3 linhas não vazias acima do bloco.
    com_pista = []
    for b in blocos:
        previas = [l for l in linhas[max(0, b["linha"] - 5):b["linha"] - 1] if l.strip()][-3:]
        if any(TITULO_EXEMPLO.match(l) or PALAVRA_EXEMPLO.search(l) for l in previas):
            com_pista.append({"linha": b["linha"], "tamanho": b["tamanho"]})

    genericas = []
    for i, linha in enumerate(linhas, start=1):
        achada = next((f for f in FRASES_GENERICAS if f in linha.lower()), None)
        if achada:
            genericas.append({"linha": i, "frase": achada})

    arvore = [i for i, l in enumerate(linhas, start=1) if ARVORE.search(l)]

    # Comandos: crases em texto corrido e linhas dentro de blocos (sem o "$ " do início).
    candidatos = set(proj["comandos_candidatos"])
    comandos = []
    for i, linha in enumerate(linhas):
        if dentro[i]:
            trechos = [re.sub(r"^\s*\$\s+", "", linha).strip()]
        else:
            trechos = re.findall(r"`([^`\n]+)`", linha)
        for trecho in trechos:
            cmd = " ".join(trecho.split())
            if COMANDO_PM.match(cmd):
                existe = any(cmd == c or cmd.startswith(c + " ") for c in candidatos)
                comandos.append({"linha": i + 1, "comando": cmd, "existe": existe})
            elif COMANDO_OUTRO.match(cmd):
                # Ferramentas que o script não verifica: existe fica None.
                comandos.append({"linha": i + 1, "comando": cmd, "existe": None})

    pastas = []
    for i, linha in enumerate(linhas, start=1):
        if dentro[i - 1]:
            continue
        if PASTA_CRASE.search(linha) or PASTA_SOLTA.search(linha) or PALAVRA_PASTA.search(linha):
            pastas.append({"linha": i, "tamanho": len(linha.strip())})

    referencias = []
    base = os.path.dirname(os.path.realpath(caminho))
    for i, linha in enumerate(linhas, start=1):
        if dentro[i - 1]:
            continue
        for alvo in REF_CAMINHO.findall(linha):
            if COMANDO_PM.match(alvo):
                continue
            existe = os.path.exists(os.path.join(raiz, alvo)) or os.path.exists(os.path.join(base, alvo))
            referencias.append({"linha": i, "caminho": alvo, "existe": existe})

    importacoes = []
    for i, linha in enumerate(linhas, start=1):
        if dentro[i - 1]:
            continue
        sem_crases = re.sub(r"`[^`]*`", "", linha)
        for alvo in IMPORTACAO.findall(sem_crases):
            p = os.path.normpath(os.path.join(base, os.path.expanduser(alvo)))
            existe = os.path.isfile(p)
            tamanho = len("\n".join(ler(p))) if existe else None
            importacoes.append({"linha": i, "alvo": alvo, "existe": existe, "caracteres": tamanho})

    segredos = []
    for i, linha in enumerate(linhas, start=1):
        for tipo, padrao in SEGREDOS:
            if padrao.search(linha):
                segredos.append({"linha": i, "tipo": tipo})

    return {
        "linhas": len(linhas),
        "caracteres": len(texto),
        "critico_mais_de_200_linhas": len(linhas) > LIMITE_LINHAS,
        "critico_mais_de_20000_caracteres": len(texto) > LIMITE_CARACTERES,
        "blocos_de_codigo": blocos,
        "blocos_com_pista_de_exemplo": com_pista,
        "blocos_longos_mais_de_30_linhas": [b for b in blocos if b["tamanho"] > LIMITE_BLOCO],
        "frases_genericas": genericas,
        "linhas_de_arvore": arvore,
        "linhas_de_pasta": pastas,
        "linhas_de_pasta_total": len(pastas),
        "linhas_de_pasta_acima_do_limite_de_linhas": len(pastas) > LIMITE_LINHAS_PASTA,
        "linhas_de_pasta_acima_do_limite_de_caracteres": [
            p for p in pastas if p["tamanho"] > LIMITE_LINHA_PASTA],
        "comandos_citados": comandos,
        "referencias_de_caminho": referencias,
        "importacoes": importacoes,
        "segredos_suspeitos": segredos,
        "quando_carrega": onde_carrega(caminho, raiz, claude_md_na_cadeia(raiz)),
    }


def main(argv):
    uso = {"listar", "projeto", "arquivo"}
    if len(argv) < 2 or argv[1] not in uso:
        print(__doc__)
        return 2
    raiz = os.getcwd()
    if argv[1] == "listar":
        resultado = listar(raiz)
    elif argv[1] == "projeto":
        resultado = projeto(raiz)
    else:
        if len(argv) < 3:
            print(json.dumps({"erro": "uso: sinais.py arquivo CAMINHO"}))
            return 2
        if not os.path.isfile(argv[2]):
            print(json.dumps({"erro": f"arquivo não encontrado: {argv[2]}"}, ensure_ascii=True))
            return 2
        resultado = arquivo(argv[2], raiz, projeto(raiz))
    print(json.dumps(resultado, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
