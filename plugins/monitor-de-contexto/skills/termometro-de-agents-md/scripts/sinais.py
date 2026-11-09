#!/usr/bin/env python3
"""Sinais determinísticos para o termômetro de AGENTS.md.

Só a biblioteca padrão. Imprime JSON com pistas; o julgamento é do Claude,
seguindo reference/criterios.md. Pista não é veredito: quando a leitura do
arquivo divergir do sinal, vale a leitura.

Uso, a partir da pasta de trabalho atual (sem cd):
  python3 sinais.py listar                 arquivos de instrução e quando cada um carrega
  python3 sinais.py projeto                se é projeto de desenvolvimento, comandos e arquivos de pronto
  python3 sinais.py arquivo CAMINHO        sinais de um arquivo
"""
import json
import os
import re
import sys

NOMES = {"AGENTS.md", "CLAUDE.md", "CLAUDE.local.md"}
IGNORAR = {"node_modules", ".git", ".venv", "venv", "vendor", "dist", "build", "target",
           ".next", "coverage", "__pycache__"}

LIMITE_LINHAS = 200
LIMITE_CARACTERES = 20_000
LIMITE_BLOCO = 30
LIMITE_LINHA_PASTA = 80
LIMITE_LINHAS_PASTA = 10
LINGUAGENS_DE_COMANDO = {"", "bash", "sh", "shell", "zsh", "console"}
EXTENSOES_DE_ARQUIVO = (
    "md|mdx|txt|json|ya?ml|toml|ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|sh|css|html|svg|"
    "png|lock|env|sql|cfg|ini"
)

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
    "npm install", "npm i", "npm ci", "npm test", "npm t", "npm start", "npm stop", "npm restart",
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
    ("chave da OpenAI", re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}")),
    ("chave Stripe", re.compile(r"(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}")),
    ("chave AWS", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("token do GitHub", re.compile(r"(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}")),
    ("token do Slack", re.compile(r"xox[abprs]-[A-Za-z0-9-]{10,}")),
    ("chave do Google", re.compile(r"AIza[0-9A-Za-z_-]{35}")),
    ("JWT", re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")),
    ("chave privada", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    # Exige um dígito no valor: "Senha: mínimo 8 caracteres" não casa.
    ("senha ou token em texto", re.compile(
        r"(?i)(?<![A-Za-z0-9])(password|passwd|senha|secret|api[_-]?key|token)\s*[:=]\s*(?=\S*\d)\S{8,}")),
]

# Árvore: ├── └── com ou sem o recuo │, a versão ASCII do tree e o formato "+--".
# Tabela markdown como |--|--| fica de fora porque tem mais de um "|".
ARVORE = re.compile(r"^\s*(?:[│ ]*[├└]─|\|\s?--(?!-)[^|]*$|`--|\+--)")
TITULO_EXEMPLO = re.compile(r"^#{1,6}\s*(exemplos?|examples?)\b", re.IGNORECASE)
PALAVRA_EXEMPLO = re.compile(r"\b(exemplos?|examples?)\b", re.IGNORECASE)
CERCA = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
COMANDO_PM = re.compile(r"^(npm|pnpm|yarn|bun|make)(\s|$)")
COMANDO_OUTRO = re.compile(r"^(pytest|uv|ruff|go|cargo|mvn|gradle|tsc|eslint|vitest|jest|npx)(\s|$)")
COMANDO_PYTHON = re.compile(r"^python3?\s+-m\s+(pytest|unittest)(\s|$)")
PASTA_CRASE = re.compile(r"`[A-Za-z0-9_][\w.\-]*(?:/[\w.\-]+)*/`")
PASTA_SOLTA = re.compile(r"(?<![\w/.\-])[A-Za-z0-9_][\w.\-]*/(?=[\s`,.;:)]|$)")
PALAVRA_PASTA = re.compile(r"\b(pastas?|diret[óo]rios?|folders?|director(?:y|ies))\b", re.IGNORECASE)
REF_ARQUIVO = re.compile(r"`((?:[\w.\-]+/)*[\w.\-]+\.(?:%s))`" % EXTENSOES_DE_ARQUIVO)
REF_PASTA = re.compile(r"`((?:[\w.\-]+/)+)`")
IMPORTACAO = re.compile(r"(?<![\w`@.])@((?:\.{1,2}/|~/)?[\w@.~/-]*[\w])")


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


def e_so_import_de_agents(caminho):
    """CLAUDE.md que só importa @AGENTS.md, ou que é link para outro arquivo: não bloqueia o AGENTS.md."""
    if os.path.islink(caminho):
        return True
    nao_vazias = [l.strip() for l in ler(caminho) if l.strip()]
    return bool(nao_vazias) and all(re.fullmatch(r"@(\./)?AGENTS\.md", l) for l in nao_vazias)


def claude_md_bloqueante(raiz):
    """CLAUDE.md, CLAUDE.local.md ou .claude/CLAUDE.md na pasta de trabalho ou acima.

    Pela documentação, o AGENTS.md é ignorado quando um deles existe. O ~/.claude/CLAUDE.md
    global não entra; só o .claude/CLAUDE.md da própria pasta de trabalho ou de uma pasta acima.
    """
    home = os.path.realpath(os.path.expanduser("~"))
    achados = []
    for pasta in cadeia(raiz):
        for candidato in ("CLAUDE.md", "CLAUDE.local.md", os.path.join(".claude", "CLAUDE.md")):
            if candidato.startswith(".claude") and pasta == home:
                continue
            caminho = os.path.join(pasta, candidato)
            if os.path.isfile(caminho) and not (
                    os.path.basename(caminho) == "CLAUDE.md" and e_so_import_de_agents(caminho)):
                achados.append(caminho)
    return achados


def onde_carrega(caminho, raiz, bloqueantes):
    """Pista de quando o Claude Code lê o arquivo. Confirme na documentação se houver dúvida."""
    real = os.path.realpath(caminho)
    pasta = os.path.dirname(real)
    if os.path.basename(pasta) == ".claude":
        pasta = os.path.dirname(pasta)
    no_inicio = pasta in set(cadeia(raiz))
    bloqueado = any(os.path.realpath(b) != real for b in bloqueantes)
    # Um CLAUDE.md próprio da pasta também bloqueia o AGENTS.md dela, salvo se só importar o AGENTS.md.
    proprio = [n for n in ("CLAUDE.md", "CLAUDE.local.md")
               if os.path.isfile(os.path.join(pasta, n)) and os.path.realpath(
                   os.path.join(pasta, n)) != real
               and not (n == "CLAUDE.md" and e_so_import_de_agents(os.path.join(pasta, n)))]

    if os.path.basename(caminho) == "AGENTS.md":
        if bloqueado or proprio:
            return "ignorado: há CLAUDE.md na pasta de trabalho ou acima"
        if not no_inicio:
            return "sob demanda"
        return "no início"
    if no_inicio:
        return "no início"
    return "sob demanda"


def ancestrais_ate_repositorio(raiz):
    """Pastas acima da de trabalho, até a raiz do repositório git (inclusive) ou a pasta pessoal."""
    home = os.path.realpath(os.path.expanduser("~"))
    acima = []
    for pasta in cadeia(raiz)[1:]:
        if pasta == home:
            break
        acima.append(pasta)
        if os.path.exists(os.path.join(pasta, ".git")):
            break
    return acima


def listar(raiz):
    achados = []
    for dp, dn, fn in os.walk(raiz):
        dn[:] = [d for d in dn if d not in IGNORAR]
        if os.path.basename(dp) == ".claude" and "worktrees" in dn:
            dn.remove("worktrees")
        for nome in fn:
            if nome in NOMES:
                achados.append(os.path.join(dp, nome))

    # Arquivos das pastas acima da de trabalho também carregam no início (ex.: rodar de apps/web).
    for pasta in ancestrais_ate_repositorio(raiz):
        for nome in NOMES:
            p = os.path.join(pasta, nome)
            if os.path.isfile(p):
                achados.append(p)

    bloqueantes = claude_md_bloqueante(raiz)
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
            "quando_carrega": onde_carrega(caminho, raiz, bloqueantes),
        }
        if os.path.islink(caminho):
            item["link_para"] = os.path.relpath(real, raiz).replace(os.sep, "/")
        itens.append(item)

    return {
        "pasta_de_trabalho": os.path.realpath(raiz),
        "claude_md_bloqueantes": bloqueantes,
        "arquivos": itens,
    }


def scripts_de(pasta):
    """Nomes de scripts do package.json da pasta, se houver e se o JSON for legível."""
    pacote = os.path.join(pasta, "package.json")
    if not os.path.isfile(pacote):
        return []
    try:
        with open(pacote, encoding="utf-8-sig") as f:
            dados = json.load(f)
    except (ValueError, OSError):
        return []
    scripts = dados.get("scripts") if isinstance(dados, dict) else None
    return list(scripts.keys()) if isinstance(scripts, dict) else []


def candidatos_de(scripts, alvos):
    candidatos = set(BUILTIN_PM)
    for nome in scripts:
        candidatos.update({f"npm run {nome}", f"pnpm run {nome}", f"bun run {nome}",
                           f"yarn run {nome}", f"pnpm {nome}", f"yarn {nome}"})
        # "npm test" equivale a "npm run test"; só os nomes padrão do npm valem sem "run".
        if nome in {"test", "start", "stop", "restart"}:
            candidatos.add(f"npm {nome}")
    if alvos:
        candidatos.add("make")  # alvo padrão
    candidatos.update(f"make {t}" for t in alvos)
    return candidatos


def projeto(raiz):
    presentes = [m for m in MARCADORES_DEV if os.path.exists(os.path.join(raiz, m))]
    scripts = scripts_de(raiz)

    makefile_nome, alvos = None, []
    for nome in ("Makefile", "makefile", "GNUmakefile"):
        if os.path.isfile(os.path.join(raiz, nome)):
            makefile_nome = nome
            break
    if makefile_nome:
        for linha in ler(os.path.join(raiz, makefile_nome)):
            # "alvo1 alvo2:" ou "alvo::" seguido de espaço ou fim de linha. Fora: "CC := gcc",
            # "X:=1", "http://x:" e linhas de receita com tabulação.
            m = re.match(r"^([A-Za-z][\w.\- ]*?)\s*::?(?=\s|$)", linha)
            if m:
                alvos.extend(m.group(1).split())

    candidatos = candidatos_de(scripts, alvos)

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


def avaliar_comando(cmd, candidatos):
    """Um comando, depois de partido em &&, ;, || e |. existe: True, False, ou None se não der para conferir."""
    partes = [p for p in re.split(r"\s*(?:&&|\|\||;|\|)\s*", cmd) if p]
    resultado = []
    for parte in partes:
        if COMANDO_PM.match(parte):
            # "make" sozinho é o alvo padrão; "make sure" não vira alvo só por começar com "make ".
            existe = any(parte == c or (c != "make" and parte.startswith(c + " ")) for c in candidatos)
            resultado.append((parte, existe))
        elif COMANDO_OUTRO.match(parte) or COMANDO_PYTHON.match(parte):
            resultado.append((parte, None))  # ferramenta que o script não confere
    return resultado


def arquivo(caminho, raiz, proj):
    linhas = ler(caminho)
    texto = "\n".join(linhas)
    base = os.path.dirname(os.path.realpath(caminho))

    # Blocos de código cercados por ``` ou ~~~. O fechamento usa o mesmo caractere e tamanho igual ou maior.
    # Uma linha com ``` e crase depois não abre bloco (CommonMark).
    blocos, dentro, aberto = [], [False] * len(linhas), None
    for i, linha in enumerate(linhas):
        if aberto is None:
            m = CERCA.match(linha)
            if m and not (m.group(1)[0] == "`" and "`" in m.group(2)):
                info = m.group(2).strip().split()
                aberto = (i, m.group(1)[0], len(m.group(1)), info[0].lower() if info else "")
            continue
        inicio, caractere, tamanho, lingua = aberto
        s = linha.strip()
        if s and set(s) == {caractere} and len(s) >= tamanho:
            blocos.append({"linha": inicio + 1, "tamanho": i - inicio - 1, "fechado": True,
                           "linguagem": lingua})
            for j in range(inicio, i + 1):
                dentro[j] = True
            aberto = None
    if aberto is not None:
        inicio = aberto[0]
        blocos.append({"linha": inicio + 1, "tamanho": len(linhas) - inicio - 1, "fechado": False,
                       "linguagem": aberto[3]})
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

    # Comandos: crases em texto corrido e linhas de blocos de shell (sem o "$ " do início).
    candidatos = set(proj["comandos_candidatos"]) | candidatos_de(scripts_de(base), [])
    comandos = []
    for i, linha in enumerate(linhas):
        if dentro[i]:
            # Só conta dentro de blocos de shell; texto de exemplo em outra linguagem fica de fora.
            bloco = next(b for b in blocos if b["linha"] <= i + 1 <= b["linha"] + b["tamanho"] + 1)
            trechos = ([re.sub(r"^\s*\$\s+", "", linha).strip()]
                       if bloco["linguagem"] in LINGUAGENS_DE_COMANDO else [])
        else:
            trechos = re.findall(r"`([^`\n]+)`", linha)
        for trecho in trechos:
            cmd = " ".join(trecho.split())
            for parte, existe in avaliar_comando(cmd, candidatos):
                comandos.append({"linha": i + 1, "comando": parte, "existe": existe})

    pastas = []
    for i, linha in enumerate(linhas, start=1):
        if dentro[i - 1]:
            continue
        if PASTA_CRASE.search(linha) or PASTA_SOLTA.search(linha) or PALAVRA_PASTA.search(linha):
            pastas.append({"linha": i, "tamanho": len(linha.strip())})

    referencias = []
    for i, linha in enumerate(linhas, start=1):
        if dentro[i - 1]:
            continue
        for alvo in REF_ARQUIVO.findall(linha) + [a.rstrip("/") for a in REF_PASTA.findall(linha)]:
            existe = os.path.exists(os.path.join(raiz, alvo)) or os.path.exists(os.path.join(base, alvo))
            referencias.append({"linha": i, "caminho": alvo, "existe": existe})

    importacoes = []
    for i, linha in enumerate(linhas, start=1):
        if dentro[i - 1]:
            continue
        sem_crases = re.sub(r"`[^`]*`", "", linha)
        for alvo in IMPORTACAO.findall(sem_crases):
            # @alfredo ou @types/node são menções, não imports: só conta caminho com extensão ou ./, ../, ~/.
            if not (re.search(r"\.[A-Za-z0-9]{1,5}$", alvo) or alvo.startswith(("./", "../", "~/"))):
                continue
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
        "quando_carrega": onde_carrega(caminho, raiz, claude_md_bloqueante(raiz)),
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
