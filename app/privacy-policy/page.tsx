import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Polityka prywatności | Up-Mentor",
  description: "Polityka prywatności serwisu Up-Mentor",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen justify-center p-7 sm:p-10">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="font-michroma text-2xl">
            Polityka prywatności
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              I. Postanowienia ogólne
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Polityka prywatności określa, jak zbierane, przetwarzane i
                przechowywane są dane osobowe Użytkowników niezbędne do
                świadczenia usług drogą elektroniczną za pośrednictwem serwisu
                internetowego{" "}
                <a
                  href="https://up-mentor.vercel.app/"
                  className="text-baby-blue hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://up-mentor.vercel.app/
                </a>{" "}
                (dalej: Serwis).
              </li>
              <li>
                Serwis zbiera wyłącznie dane osobowe niezbędne do świadczenia i
                rozwoju usług w nim oferowanych.
              </li>
              <li>
                Dane osobowe zbierane za pośrednictwem serwisu Up-Mentor są
                przetwarzane zgodnie z Rozporządzeniem Parlamentu Europejskiego
                i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie
                ochrony osób fizycznych w związku z przetwarzaniem danych
                osobowych i w sprawie swobodnego przepływu takich danych oraz
                uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie
                danych, dalej RODO) oraz ustawą o ochronie danych osobowych z
                dnia 10 maja 2018 r.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              II. Administrator danych
            </h2>
            <p>
              Administratorem danych osobowych zbieranych poprzez Serwis jest
              Zuzanna Wilkosz, adres poczty elektronicznej:{" "}
              <a
                href="mailto:s27576@pjwstk.edu.pl"
                className="text-baby-blue hover:underline"
              >
                s27576@pjwstk.edu.pl
              </a>{" "}
              (dalej: Administrator).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              III. Cel zbierania danych osobowych
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Dane osobowe wykorzystywane są w celu:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    rejestracji konta i weryfikacji tożsamości Użytkownika,
                  </li>
                  <li>umożliwienia logowania do Serwisu,</li>
                  <li>realizacji usług i e-usług,</li>
                  <li>
                    komunikacji z Użytkownikiem (livechat, formularz
                    kontaktowy itp.),
                  </li>
                  <li>
                    wysyłki instrukcji do resetowania hasła oraz plików pdf,
                  </li>
                  <li>prowadzenia systemu opinii,</li>
                  <li>
                    prezentacji profilu Użytkownika innym Użytkownikom,
                  </li>
                  <li>prezentacji oferty,</li>
                  <li>obsługi zapytań przez formularz.</li>
                </ul>
              </li>
              <li>
                Podanie danych jest dobrowolne, ale niezbędne do zawarcia umowy
                albo skorzystania z innych funkcjonalności Serwisu.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              IV. Rodzaj przetwarzanych danych osobowych
            </h2>
            <p>
              Administrator może przetwarzać dane osobowe Użytkownika: imię i
              nazwisko, data urodzenia, adres świadczenia usługi, adres e-mail,
              numer telefonu.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              V. Okres przetwarzania danych osobowych
            </h2>
            <p>
              Dane osobowe Użytkowników będą przetwarzane do momentu istnienia
              konta Użytkownika.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              VI. Udostępnianie danych osobowych
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Dane osobowe Użytkowników mogą być przekazywane: podmiotom
                powiązanym z Administratorem, jego podwykonawcom, podmiotom
                współpracującym z Administratorem np. firmom obsługującym
                e-płatności, firmom świadczącym usługi kurierskie/pocztowe,
                kancelariom prawnym.
              </li>
              <li>
                Dane osobowe Użytkowników nie będą/będą przekazywane poza teren
                Europejskiego Obszaru Gospodarczego (EOG).
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              VII. Prawa Użytkowników
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Użytkownik Serwisu ma prawo do: dostępu do treści swoich danych
                osobowych, ich sprostowania, usunięcia, ograniczenia
                przetwarzania.
              </li>
              <li>
                Użytkownik ma prawo złożyć skargę do Prezesa Urzędu Ochrony
                Danych Osobowych, jeśli uzna, że przetwarzanie narusza jego
                prawa i wolności (RODO).
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              VIII. Pliki cookies
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Serwis korzysta z plików cookies.</li>
              <li>
                Podmiotem zamieszczającym na urządzeniu końcowym Użytkownika
                Serwisu pliki cookies oraz uzyskującym do nich dostęp jest
                operator Serwisu.
              </li>
              <li>
                Pliki cookies wykorzystywane są do utrzymania sesji użytkownika
                Serwisu (po zalogowaniu), dzięki której użytkownik nie musi na
                każdej podstronie Serwisu ponownie wpisywać loginu i hasła.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="font-michroma text-base text-white">
              IX. Postanowienia końcowe
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Administrator ma prawo do wprowadzenia zmian w Polityce
                prywatności, przy czym prawa Użytkowników nie zostaną
                ograniczone.
              </li>
              <li>
                Informacja o wprowadzonych zmianach pojawi się w formie
                komunikatu dostępnego w Serwisie.
              </li>
              <li>
                W sprawach nieuregulowanych w niniejszej Polityce prywatności
                obowiązują przepisy RODO i przepisy prawa polskiego.
              </li>
            </ol>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
