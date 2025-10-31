# 🚨 TURVALLISUUSKORJAUS - Azure Storage Avainten Vuoto

## Tilanne
GitHub Push Protection havaitsi Azure Storage Account Access Keys -salaisuuksia git-historiassasi. 
Nämä avaimet ovat nyt VAARANTUNEET ja ne täytyy vaihtaa VÄLITTÖMÄSTI.

## KRIITTISET TOIMENPITEET (Tee tässä järjestyksessä!)

### Vaihe 1: Poista appsettings.json git-historiasta

```bash
# Varmista että olet pääkansiossa
cd C:\Users\Antti\tehtäväapppp

# Poista appsettings.json kaikista commiteista
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch Backend/TehtavaApp.API/appsettings.json" \
  --prune-empty --tag-name-filter cat -- --all

# TAI käytä BFG Repo-Cleaner (suositellumpi, nopeampi):
# 1. Lataa BFG: https://rtyley.github.io/bfg-repo-cleaner/
# 2. Aja: java -jar bfg.jar --delete-files appsettings.json
# 3. Aja: git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### Vaihe 2: Poista kaikki Azure-yhteydet git-historiasta

```bash
# Etsi kaikki Azure connection stringit
git log --all --full-history --source --pretty=format: -- "*appsettings*.json" | grep -i "accountkey\|connectionstring"

# Käytä BFG:tä poistamaan tiedostot jotka sisältävät salaisuuksia
java -jar bfg.jar --replace-text passwords.txt

# passwords.txt sisältö (luo tämä tiedosto):
# AccountKey=***REMOVED***
# DefaultEndpointsProtocol=***REMOVED***
```

### Vaihe 3: Puhdista git-historia

```bash
# Poista vanhat reflog-merkinnät
git reflog expire --expire=now --all

# Pakkaa repository
git gc --prune=now --aggressive

# Pakota push (VAROITUS: tämä ylikirjoittaa remote-historian!)
git push origin production --force
```

### Vaihe 4: 🔑 UUDISTA AZURE STORAGE AVAIMET (PAKOLLINEN!)

**Salaisuutesi ovat nyt julkisia! Vanha avain on kompromisoitunut.**

1. Kirjaudu Azure Portaliin: https://portal.azure.com
2. Navigoi Storage Account -resurssiisi
3. Valitse "Access keys" vasemmasta valikosta
4. Klikkaa "Rotate key" key1 tai key2 kohdalla
5. Kopioi UUSI connection string
6. Päivitä se paikalliseen `appsettings.json` tiedostoon (joka on nyt .gitignoressa)

### Vaihe 5: Päivitä muut salaisuudet

Vaihda myös:
- JWT Secret Key
- Admin-salasana
- MongoDB connection string (jos sisältää salasanoja)
- OpenAI/Azure OpenAI API-avaimet

### Vaihe 6: Käytä turvallisia menetelmiä

**Kehitys:**
```bash
# Käytä User Secrets (.NET)
dotnet user-secrets init --project Backend/TehtavaApp.API
dotnet user-secrets set "AzureBlobStorage:ConnectionString" "YOUR_NEW_CONNECTION_STRING" --project Backend/TehtavaApp.API
dotnet user-secrets set "AIGrading:OpenAI:ApiKey" "YOUR_OPENAI_KEY" --project Backend/TehtavaApp.API
```

**Tuotanto:**
- Käytä Azure Key Vault
- Tai ympäristömuuttujia (Environment Variables)
- Tai Azure App Service Configuration

### Vaihe 7: Varmista että .gitignore on kunnossa

✅ Tarkista että `.gitignore` sisältää:
```
/Backend/TehtavaApp.API/appsettings.json
/Backend/TehtavaApp.API/appsettings.Development.json
/Backend/TehtavaApp.API/appsettings.Production.json
/Frontend/tehtavaappfrontend/.env
```

### Vaihe 8: Testaa uudet asetukset

```bash
# Kopioi example-tiedosto
cp Backend/TehtavaApp.API/appsettings.json.example Backend/TehtavaApp.API/appsettings.json

# Päivitä UUDET salaisuudet appsettings.json:iin (paikallinen, ei versionhallinnassa)
# Testaa että sovellus käynnistyy
cd Backend/TehtavaApp.API
dotnet run
```

## NOPEA RATKAISU (Jos edellä on liian monimutkaista)

Jos git-historian puhdistus on liian vaikeaa, voit tehdä näin:

```bash
# 1. Poista koko paikallinen repo ja kloonaa uudelleen
cd ..
rm -rf tehtäväapppp
git clone https://github.com/aejlaaks/AssignmentAndMaterialApp.git tehtäväapppp
cd tehtäväapppp

# 2. Luo UUSI branch ilman historiaa
git checkout --orphan clean-production
git add -A
git commit -m "Fresh start without secrets"

# 3. Poista vanha production branch ja luo uusi
git branch -D production
git branch -m production

# 4. Pakota push
git push origin production --force

# 5. UUDISTA KAIKKI AZURE AVAIMET!
```

## Tarkistuslista

- [ ] Azure Storage avaimet uudistettu
- [ ] JWT Secret vaihdettu
- [ ] Admin-salasana vaihdettu
- [ ] .gitignore päivitetty
- [ ] appsettings.json poistettu git-historiasta
- [ ] Uudet salaisuudet tallennettu turvallisesti (User Secrets / Key Vault)
- [ ] Sovellus testattu uusilla salaisuuksilla
- [ ] Push onnistuu ilman GitHub:n varoituksia

## Lisätietoja

- GitHub Push Protection: https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
- .NET User Secrets: https://learn.microsoft.com/aspnet/core/security/app-secrets
- Azure Key Vault: https://azure.microsoft.com/services/key-vault/

