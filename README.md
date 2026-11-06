# Satelliittitutka

Toimituksen 1080 × 1920 -pystynäytölle tehty satelliittikartta. Toimii myös tavallisessa selaimessa. Ei palvelinta tai API-avainta. Julkaisu GitHub Pagesissa edellyttää GitHub-tiliä ja Pagesin sallivaa repositorya.

## Julkaisu GitHub Pagesiin

1. Luo GitHubiin repository, esimerkiksi `satelliittitutka`, oletushaarana `main`.
2. Pura julkaisupaketin sisältö repositoryn juureen. Myös piilotiedostot `.github/workflows/pages.yml` ja `.nojekyll` pitää siirtää. Gitillä tämä onnistuu luotettavimmin; pelkkä näkyvien tiedostojen raahaus ei välttämättä sisällytä niitä.
3. Valitse **Settings → Pages → Source → GitHub Actions**.
4. Salli **Settings → Actions → General → Workflow permissions → Read and write permissions**, jos organisaatiosi käytäntö sallii sen. Julkaisutyö tallentaa ratatiedot ja mahdollisen lähdevirheen repositoryyn.
5. Käynnistä **Actions → Update orbits and publish Pages → Run workflow**. Ensimmäinen julkaisu käyttää mukana olevaa aitoa lähdeaineistoa; manuaalinen ajo hakee uuden aineiston, jos edellinen onnistunut haku on yli kaksi tuntia vanha.
6. Valmis julkinen osoite on tavallisesti `https://KÄYTTÄJÄ.github.io/satelliittitutka/`. Avaa osoite ja tarkista aineiston hakuaika sekä kohteiden määrä ennen näyttökäyttöä.

Sivusto julkaisee ratatiedot avoimesti. Paketissa ei ole tunnuksia tai yksityisiä aineistoja. Jos repositoryn julkaisuasetukset poikkeavat yllä olevasta, noudata organisaatiosi käytäntöä.

## QEM ja toimituksen näyttö

Lisää julkaistu HTTPS-osoite QEM:n verkkosivusisällöksi. Näyttö: pysty, 9:16, 1080 × 1920. Sovellus skaalautuu näkyvään selainikkunaan. Käytä koko näytön tilaa ilman selaimen työkalupalkkeja. Valitse QEM:ssa riittävän pitkä näyttöjakso, esimerkiksi 300 sekuntia, jos sisältö kuuluu vaihtuvaan soittolistaan. QEM:n nimenomaisia upotus- ja verkkoasetuksia ei ole tässä ympäristössä testattu.

Kartan ja ratalaskennan kirjastot latautuvat jsDelivristä; karttatiilet OpenStreetMapista. Näiden verkkotunnusten on oltava sallittuja näyttölaitteen verkossa. OpenStreetMapin tekijätiedot säilytetään näkyvissä. Karttapohjaa ei ladata ennakkoon eikä offline-käyttöön. Suuressa näyttölaitekannassa tarvitaan erillinen karttatiilipalvelu OSM:n käyttöperiaatteiden mukaisesti.

## Haku ja 1–3 satelliitin seuranta

Avaa **Hae ja valitse satelliitteja**. Kirjoita nimi, nimen osa tai NORAD-tunnus. Haku kattaa sivulle ladatun 350 kohteen lähtövalikoiman, ei kaikkia maailman satelliitteja. Esimerkiksi `ISS`, `NOAA`, `Sentinel`, `Tiangong` tai `25544` toimivat hakusanoina valikoiman sisältämille kohteille. Kirjainkoolla ei ole merkitystä. Hakutuloksista näytetään enintään 40 kerrallaan; rajaa hakua tarvittaessa.

Valitse yhdestä kolmeen kohdetta. Jokainen saa oman värinsä, rataviivansa ja tietorivinsä. Kartta sovitetaan valittuihin kohteisiin. **Näytä valitut kartalla** sovittaa kartan uudelleen. Sulje hakupaneeli **Valmis**-painikkeella näyttökäyttöä varten. Karttapisteen tai lähiluettelon kohteen painaminen lisää sen seurantaan, jos tilaa on.

Ryhmäsuodatin koskee kartan muita kohteita, lähiluetteloa ja ylärivin lukuja. Erikseen valitut satelliitit pysyvät näkyvissä suodattimesta riippumatta. Kolmen valinnan jälkeen muut hakutulokset ovat pois käytöstä, kunnes poistat yhden valinnan. Kohteen voi poistaa sen tietorivin ×-painikkeella tai hakutuloksesta. Automaattinen vaihto -painike tyhjentää kiinnitetyt valinnat ja palauttaa automaattiseurannan.

Valitut NORAD-tunnukset tallentuvat julkaistun sivun osoitteeseen, esimerkiksi `?track=25544,48274`. Kopioi selaimen osoite QEM:n sivuosoitteeksi valinnan jälkeen: sama valikoima palautuu sivua avattaessa ja päivitettäessä. Tämä ei edellytä evästeitä tai kirjautumista. Tasklet-esikatselun sisäistä osoitetta ei pidä käyttää QEM:ssa. Jos valittu kohde poistuu myöhemmin lähdevalikoimasta, tietorivi ilmoittaa puuttuvasta datasta; sille ei keksitä sijaintia.

## Mitä näytetään

- CelesTrakin ryhmät: sää, maanhavainnointi, tiede, operatiivinen GPS ja Galileo sekä ISS ja Tiangong. Telakoituneita asemaosia, erikseen luetteloituja huoltoaluksia, rakettivaiheita tai nimellä merkittyä romua ei esitetä erillisinä asemina. Kyse ei ole kaikista satelliiteista. Starlink ei kuulu ensimmäiseen versioon.
- Kartan piste on satelliitin **alisatelliittipiste**, ei satelliitin etäisyys havaitsijasta. Lähimpien kohteiden etäisyys mitataan maanpinnalla Helsinkiin.
- Suomen lähialue tarkoittaa 1 500 km:n ympyrää Helsingistä, ei valtakunnan rajojen sisäpuolta.
- Helsingin taivaalla tarkoittaa yli 10°:n laskennallista korkeuskulmaa. Se ei tarkoita paljain silmin näkyvää satelliittia.
- Nopeus on maakeskisen inertiaalisen koordinaatiston ratanopeus, ei karttapisteen nopeus maanpintaan nähden. Korkeus on ellipsoidikorkeus.
- Katkoviivat ovat valittujen kohteiden laskennalliset radat −30 minuutista +90 minuuttiin. Ilman omia valintoja esittelykohde vaihtuu automaattisesti 25 sekunnin välein lähimpien joukosta. Omat 1–3 valintaa pysäyttävät automaattivaihdon.
- Kaikki-kategoria ei sisällä koko kiertoradan liikennettä. Ryhmäsuodatin rajaa kartan taustakohteet, yläreunan luvut ja lähiluettelon, ei erikseen valittuja seurattavia kohteita. ISS-ohitus on suodattimesta riippumaton.
- ISS:n seuraava ohitus lasketaan Helsingille 48 tunnin ajalta, vähintään 10°:n korkeuskulmalla. Aikavyöhyke on Europe/Helsinki, kesäaika huomioiden. Optisia näkyvyysoloja, Maan varjoa, säätä tai horisonttiesteitä ei mallinneta.

## Datan päivittyminen ja epävarmuus

Ratatiedot ovat aitoa CelesTrakin GP-aineistoa OMM-yhteensopivana JSONina. Paikat lasketaan satellite.js:n SGP4-mallilla kerran sekunnissa. Tämä ei ole live-paikannustelemetriaa. Ratamallin virhe kasvaa ajan mukana ja voi muuttua nopeasti ratamuutoksissa. Tietoja ei saa käyttää operatiiviseen avaruusliikenteen turvallisuus- tai törmäysarviointiin.

GitHubin ajastettu julkaisu hakee kuusi rajattua ryhmää kuuden tunnin välein. GitHub voi viivästää ajoja; inaktiivisen julkisen repositoryn ajastukset voivat poistua käytöstä. Näyttösivu tarkistaa oman julkaistun datatiedostonsa 15 minuutin välein, mutta ei käy itse CelesTrakissa. Päivitä-painike hakee vain julkaistun tiedoston, ei uutta aineistoa lähteestä.

Hakuaika ja yksittäisen ratatiedon epoch ovat eri asioita. Molemmat on huomioitu: yli 8 h sitten haetusta aineistosta varoitetaan, yli 48 h vanhat radat merkitään, yli 7 vrk vanhoista radoista ei piirretä pisteitä. ISS-ohitusta ei lasketa yli 48 h vanhasta radasta. Osa GPS/Galileo-radoista voi olla muita ryhmiä vanhempia; varoitus ei itsessään osoita vikaa lähteen haussa.

Jos lähde palauttaa HTTP-virheen tai virheellistä aineistoa, päivitys keskeytyy heti eikä seuraavia ryhmiä haeta. Edellinen ehjä tiedosto säilyy. Lähdepyynnöt pysäytetään tiedostolla `data/update-blocked.json` myös seuraavissa ajoissa. Selvitä syy ja käynnistä manuaalinen ajo valinnalla **resume_source**. GitHub ilmoittaa epäonnistuneesta työnkulusta tilisi ilmoitusasetusten mukaisesti. Julkaisun ikääntyminen näkyy myös näyttösivulla.

## Paikallinen testaus

Käynnistä repositoryn juuressa `python3 -m http.server 8000` ja avaa `http://localhost:8000`. Älä avaa `index.html`:ää suoraan tiedostona, sillä selaimen tiedostorajoitukset voivat estää JSONin latauksen.

## Lähteet ja lisenssit

- [CelesTrak: GP-formaatit](https://celestrak.org/NORAD/documentation/gp-data-formats.php)
- [CelesTrak: käyttöperiaatteet](https://celestrak.org/usage-policy.php)
- [satellite.js](https://github.com/shashwatak/satellite-js), MIT
- [Leaflet](https://leafletjs.com/), BSD-2-Clause
- [OpenStreetMap](https://www.openstreetmap.org/copyright), kartta-aineisto ODbL; [tiilipalvelun käyttöperiaatteet](https://operations.osmfoundation.org/policies/tiles/)

Sovelluskoodi on käyttäjälle vapaasti muokattavissa. Kolmansien osapuolten dataa ja kirjastoja koskevat niiden omat ehdot. Kyseessä ei ole Flightradarin tuote.
