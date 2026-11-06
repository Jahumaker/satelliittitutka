# Testaus 5.11.2026

## Toteutunut selaintesti

Chromium, aito CelesTrak-aineisto, 350 yksilöllistä kohdetta. Testihetkellä 349:lle saatiin hyväksytty sijainti. Laskennassa virheellisiä tai alle 80 km:n korkeuteen päätyviä pisteitä ei piirretä. Ryhmät: asemat 2, sää 74, maanhavainnointi 165, tiede 45, GPS 32, Galileo 32. Ryhmien väliset kaksoiskappaleet poistettu NORAD-tunnuksella.

- Pystynäyttö 1080 × 1920: koko näkymä mahtui ruudulle ilman vieritystä. Karttatiilet latautuivat ja sijainnit päivittyivät.
- Vaakanäyttö 1920 × 1080 sekä mobiili 390 × 844: ei pysty- tai vaakavieritystä testatussa näkymässä.
- Sääsuodatin: 74 kohdetta. Asemasuodatin: 2 kohdetta.
- Maailma-/Suomi-vaihto, lähiluettelosta valitseminen, automaattivaihdon pysäytys ja käynnistys sekä datatiedoston uudelleenlataus toimivat.
- Vanhaksi muutettu hakuaika tuotti päivitysvaroituksen.
- Yhdeksän päivän ikäisiksi muutetut radat tuottivat nolla piirrettävää pistettä ja estivät ISS-ohitusennusteen.
- Ei selaimen JavaScript- tai konsolivirheitä toteutuneissa testeissä.

## Haun ja moniseurannan lisätesti 5.11.2026

- Nimihaku ilman kirjainkokoriippuvuutta sekä NORAD-tunnushaku toimivat. Tuntematon hakusana tuotti tyhjän tuloksen.
- Kolme valittua kohdetta tuotti kolme samanaikaista rataviivaa, kolme eri korostusväriä sekä kolme tietoriviä. Neljäs valinta estettiin.
- Ryhmäsuodatus ja ratatiedoston päivitys eivät poistaneet valittuja kohteita.
- Valinnat palautuivat osoitteen `track`-parametrista sivun uudelleenlatauksessa.
- Yhden kohteen poisto säilytti muiden kohteiden värit. Automaattiseurannan palautus tyhjensi valinnat ja osoiteparametrin.
- Kolmen kohteen näkymä mahtui 1080 × 1920-, 1920 × 1080- ja 390 × 844 -testi-ikkunoihin. Ei JavaScript-virheitä.

## Päivitysohjelman testaus ilman verkkopyyntöjä

Simuloitu lähde testasi kuuden ryhmän onnistuneen haun, kahden tunnin minimivälin, pysähtymisen ensimmäiseen lähdevirheeseen, edellisen ehjän tiedoston säilymisen, lähdepyyntöjen pysyvän tauon ja manuaalisen jatkamisen. Kaikki läpäistiin.

## Ei vielä varmistettu

- GitHub Pages -julkaisu ja ajastuksen toteutuminen käyttäjän repositoryssa.
- QEM-soittimen toiminta ja toimituksen näytön verkkoasetukset.
- Laskennallisten sijaintien tai ohitusten riippumaton vertailu toiseen ratalaskentajärjestelmään.
- Pitkä yhtäjaksoinen näyttöajo. Ajat ja sijainnit eivät ole operatiivisesti varmennettua avaruusliikennetietoa.
