# =====================================================================
#  Flow AMC — appliquer et pousser « Panier 2 » sur main (production)
#
#  A lancer dans TON clone du depot :
#     cd C:\Users\User18\Desktop\flow_amc
#     powershell -ExecutionPolicy Bypass -File .\POUSSER-PANIER2.ps1
#
#  Il faut que flow-amc-panier2-repo.zip soit dans le meme dossier,
#  ou dans Telechargements, ou sur le Bureau.
#
#  Le script :
#    1. verifie le depot (bon remote, bonne branche)
#    2. git pull
#    3. sauvegarde les 12 fichiers dans _sauvegarde-panier2\
#    4. copie les 12 fichiers du zip par-dessus les anciens
#    5. verifie les empreintes une par une
#    6. commit + push sur main  (demande une confirmation)
# =====================================================================

$ErrorActionPreference = 'Stop'
function L($t, $c='Gray') { Write-Host $t -ForegroundColor $c }

L ""
L "=============================================================" Cyan
L "   FLOW AMC — PANIER 2 -> MAIN (PRODUCTION)" Cyan
L "=============================================================" Cyan

# ---------- 1. le dossier ----------
L ""
L "1. DEPOT" Cyan
L ("   " + (Get-Location).Path)
if ((Get-Location).Path -match " ") { L "   (espace dans le chemin : sans consequence, tout est relatif)" DarkGray }

# si on est dans le dossier parent, on descend tout seul dans flow_amc
if (-not (Test-Path ".\.git") -and (Test-Path ".\flow_amc\.git")) {
  L ""
  L "   -> sous-dossier flow_amc detecte, je descends dedans." Cyan
  Set-Location ".\flow_amc"
  L ("   " + (Get-Location).Path)
}
if (-not (Test-Path ".\.git") -and (Test-Path ".\flow-amc\.git")) {
  L ""
  L "   -> sous-dossier flow-amc detecte, je descends dedans." Cyan
  Set-Location ".\flow-amc"
  L ("   " + (Get-Location).Path)
}
if (-not (Test-Path ".\.git")) {
  L "   [KO] pas de .git ici : ce dossier n'est pas un clone du depot." Red
  L "" Yellow
  L "   Deux options :" Yellow
  L "   A) tu as un autre dossier qui est le clone -> lance ce script dedans" Yellow
  L "   B) celui-ci est ta copie de travail -> clone a cote, sans espace dans le nom :" Yellow
  L "" Yellow
  L '      cd "$env:USERPROFILE\Desktop"' Yellow
  L '      git clone https://github.com/Formajob/flow_amc.git flow_amc' Yellow
  L '      cd flow_amc' Yellow
  L '      # puis relance ce script ici' Yellow
  exit
}
# un espace dans le chemin n'est pas un probleme : tout est relatif dans ce script.
$remote = (git remote get-url origin 2>$null)
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)
L ("   remote  : " + $remote)
L ("   branche : " + $branch)
if ($remote -notmatch "flow_amc") { L "   [KO] ce n'est pas le depot flow_amc." Red; exit }
if ($branch -ne "main") { L ("   [ATTENTION] tu n'es pas sur main mais sur " + $branch) Yellow }

# ---------- 2. le zip ----------
$zip = $null
$candidats = @(
  "$PWD\flow-amc-panier2-repo.zip",
  "$PWD\..\flow-amc-panier2-repo.zip",
  "$PWD\..\..\flow-amc-panier2-repo.zip",
  "$env:USERPROFILE\Downloads\flow-amc-panier2-repo.zip",
  "$env:USERPROFILE\Desktop\flow-amc-panier2-repo.zip"
)
foreach ($c in $candidats) {
  if (Test-Path $c) { $zip = (Resolve-Path $c).Path; break }
}
if (-not $zip) {
  # derniere chance : recherche sur le Bureau
  $trouve = Get-ChildItem -Path "$env:USERPROFILE\Desktop" -Recurse -Depth 2 -Filter "flow-amc-panier2-repo.zip" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($trouve) { $zip = $trouve.FullName }
}
if (-not $zip) { L ""; L "   [KO] flow-amc-panier2-repo.zip introuvable." Red; L "   Place-le ici, dans Telechargements ou sur le Bureau." Red; exit }
L ("   zip     : " + $zip)

# ---------- 3. pull ----------
L ""
L "2. MISE A JOUR DU DEPOT" Cyan
git pull
if ($LASTEXITCODE -ne 0) { L "   [KO] git pull a echoue (authentification ?)." Red; exit }

# ---------- 4. extraction + sauvegarde + copie ----------
$tmp = Join-Path $env:TEMP "amc_panier2_repo"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Path $tmp | Out-Null
Expand-Archive -LiteralPath $zip -DestinationPath $tmp -Force

$fichiers = @(
  "app/api/entries/route.js",
  "base-amc.sql",
  "schema.sql",
  "public/acces.html",
  "public/administration.html",
  "public/classement.html",
  "public/collecte.html",
  "public/communiques.html",
  "public/distribution.html",
  "public/index.html",
  "public/preparation.html",
  "public/transport.html"
)

$save = Join-Path $PWD "_sauvegarde-panier2"
if (Test-Path $save) { Remove-Item -Recurse -Force $save }
New-Item -ItemType Directory -Path $save | Out-Null

L ""
L "3. SAUVEGARDE + COPIE" Cyan
foreach ($f in $fichiers) {
  $src = Join-Path $tmp $f
  $dst = Join-Path $PWD $f
  if (-not (Test-Path $src)) { L ("   [KO] absent du zip : " + $f) Red; continue }
  if (Test-Path $dst) {
    $backup = Join-Path $save $f
    $dir = Split-Path $backup -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item $dst $backup -Force
  }
  $destDir = Split-Path $dst -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item $src $dst -Force
  L ("   [x] " + $f)
}
L ("   sauvegarde dans : " + $save)

# ---------- 5. verification ----------
L ""
L "4. VERIFICATION DES EMPREINTES" Cyan
$attendu = [ordered]@{
  "app/api/entries/route.js"  = "3af624fe91650be4"
  "base-amc.sql"              = "c3b9d8d34bf1715c"
  "schema.sql"                = "6787d54bf544d8d6"
  "public/acces.html"         = "c027e840be9c6265"
  "public/administration.html"= "4b220e75b2d675f6"
  "public/classement.html"    = "8074bb85c01e014e"
  "public/collecte.html"      = "55ae1337152ae8b1"
  "public/communiques.html"   = "cd91052f667f6ff2"
  "public/distribution.html"  = "799a4cfb218f37c8"
  "public/index.html"         = "60bc36cb4c47bd1b"
  "public/preparation.html"   = "cbcaca9b46dd12d5"
  "public/transport.html"     = "4ca8b3938b38dd5b"
}
$ok = 0
foreach ($f in $attendu.Keys) {
  if (-not (Test-Path $f)) { L ("   [ABSENT]   " + $f) Red; continue }
  $h = (Get-FileHash $f -Algorithm SHA256).Hash.Substring(0,16).ToLower()
  if ($h -eq $attendu[$f]) { L ("   [OK]       " + $f) Green; $ok++ }
  else { L ("   [DIFFERENT] " + $f + "  " + $h) Red }
}
L ""
if ($ok -ne 12) {
  L ("   " + $ok + " / 12 fichiers seulement. On s'arrete la.") Red
  L "   Restaure avec :  Copy-Item -Recurse -Force .\_sauvegarde-panier2\* ." Yellow
  exit
}
L "   12 / 12 : tous les fichiers sont en place." Green

# ---------- 6. ce qui va partir ----------
L ""
L "5. CE QUI VA ETRE COMMITE" Cyan
git status --short

L ""
L "=============================================================" Yellow
L "   ATTENTION : tu es sur $branch." Yellow
L "   Un push sur main DECLENCHE le deploiement en production" Yellow
L "   de flowamc.vercel.app." Yellow
L "=============================================================" Yellow
$rep = Read-Host "   Ecris OUI (en majuscules) pour commiter et pousser"
if ($rep -ne "OUI") {
  L ""
  L "   Arrete. Les fichiers sont modifies sur le disque, rien n'est parti." Yellow
  L "   Pour revenir en arriere :  git checkout -- ." Yellow
  exit
}

# ---------- 7. commit + push ----------
L ""
L "6. COMMIT + PUSH" Cyan
git add -A
git commit -m "Ajoute l'article Panier 2 (2 points par panier)"
if ($LASTEXITCODE -ne 0) { L "   [KO] commit impossible." Red; exit }
git push origin $branch
if ($LASTEXITCODE -ne 0) {
  L ""
  L "   [KO] push refuse. Essaie :" Yellow
  L "        git pull --rebase origin $branch" Yellow
  L "        git push origin $branch" Yellow
  exit
}

L ""
L "7. TERMINE" Green
L ("   commit : " + (git rev-parse --short HEAD))
L "   Vercel va construire puis publier dans ~1 minute."
L "   Ensuite : Ctrl+Shift+R sur https://flowamc.vercel.app/collecte.html"
L "   puis saisis 3 « Panier 2 » : le groupe doit prendre 6 points."
L ""
