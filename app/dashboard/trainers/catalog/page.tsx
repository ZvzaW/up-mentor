import Link from "next/link"
import { getCatalogTrainers } from "@/lib/server-get-functions/catalog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, MapPin, Star } from "lucide-react"
import { countCooperations } from "@/lib/server-get-functions/my-trainers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BackButton } from "@/components/common/back-button"
import { auth } from "@/auth"

type TrainersCatalogPageProps = {
  searchParams?: Promise<{
    name?: string
    city?: string
  }>
}

export default async function TrainersCatalogPage({
  searchParams,
}: TrainersCatalogPageProps) {  
  
  const session = await auth()
  const userId = session?.user?.id ?? ""

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const nameQuery = resolvedSearchParams?.name?.trim() ?? ""
  const cityQuery = resolvedSearchParams?.city?.trim() ?? ""
  const hasActiveFilters = nameQuery.length > 0 || cityQuery.length > 0


  const [trainersResult, countResult] = await Promise.all([
    getCatalogTrainers({ name: nameQuery, city: cityQuery }),
    countCooperations(userId),
  ])

  const pageError = trainersResult.error ?? countResult.error
  const trainers = trainersResult.data ?? []
  const cooperationsCount = countResult.data ?? 0

  return (
    <div className="space-y-4 p-3">
      {cooperationsCount > 0 && <BackButton label="Wróć do moich trenerów" />}

      <h1 className="font-michroma text-center text-2xl sm:text-left md:ml-1">
        Katalog trenerów
      </h1>

      {pageError && (
        <Card>
          <CardContent>
            <Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-col items-baseline justify-between md:flex-row">
            <p className="text-baby-blue mx-auto mb-6 md:mx-0">
              Znajdź swojego przyszłego trenera
            </p>
            <form
              key={`${nameQuery}-${cityQuery}`}
              className="mx-auto mb-6 flex w-full flex-col gap-3 md:mx-0 md:w-[50%] md:flex-row"
            >
              <Input
                name="name"
                defaultValue={nameQuery}
                placeholder="Szukaj po imieniu i nazwisku"
                className="rounded-xl placeholder:text-zinc-400"
              />
              <Input
                name="city"
                defaultValue={cityQuery}
                placeholder="Szukaj po mieście"
                className="rounded-xl placeholder:text-zinc-400"
              />
              <div className="flex justify-center gap-2">
                <Button type="submit">Szukaj</Button>
                {hasActiveFilters && (
                  <Button asChild className="bg-gold hover:bg-gold/60">
                    <Link href="/dashboard/trainers/catalog">
                      Wyczyść filtry
                    </Link>
                  </Button>
                )}
              </div>
            </form>
          </div>

          {!pageError && trainers.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p>
                {hasActiveFilters
                  ? "Brak trenerów pasujących do podanych filtrów."
                  : "Brak publicznych trenerów w systemie."}
              </p>
            </div>
          )}
          {!pageError && trainers.length > 0 && (
            <div className="grid grid-cols-1 gap-5">
              {trainers.map((trainer) => (
                <Link
                  key={trainer.id}
                  href={`/dashboard/trainers/catalog/${trainer.slug}`}
                  className="bg-dirty-blue hover:bg-hover group flex items-center justify-between rounded-xl p-5 transition-all"
                >
                  <div className="w-[95%] grid-cols-8 items-center space-y-3 sm:grid sm:space-y-0">
                    <p className="text-gold text-md col-span-3 truncate pr-3">
                      {trainer.name}
                    </p>
                    <div className="col-span-3 flex items-center gap-2 pr-8 text-sm text-gray-300">
                      <MapPin className="text-baby-blue h-4 w-4 shrink-0" />
                      <span className="mt-0.5 truncate">
                        {trainer.workplaces.length > 0
                          ? trainer.workplaces.join(", ")
                          : "Brak miejsc pracy"}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-sm text-gray-300">
                      <Star className="text-baby-blue h-4 w-4 shrink-0" />
                      <span className="">
                        {trainer.averageRate !== null
                          ? `Średnia ocen: ${trainer.averageRate}/5`
                          : "Brak opinii"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
