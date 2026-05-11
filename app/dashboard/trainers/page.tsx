import { redirect } from "next/navigation"
import { getMyTrainers } from "@/actions/my-trainers"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronRight, MapPin } from "lucide-react"

export default async function TrainersPage() {
  const result = await getMyTrainers()
  const trainers = result.data ?? []

  if (!result.error && trainers.length === 0) {
    redirect("/dashboard/trainers/catalog")
  }

  if (!result.error && trainers.length === 1) {
    redirect(`/dashboard/trainers/${trainers[0].slug}`)
  }

  return (
    <div className="p-3">
      <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:mb-5 sm:flex-row">
        <h1 className="font-michroma text-2xl md:ml-1">Twoi trenerzy</h1>

        <Button
          asChild
          variant="secondary"
          className="font-michroma flex w-[185px] gap-2 text-xs"
        >
          <Link href="/dashboard/trainers/catalog">
            <BookOpen className="shrink-0" />
            Katalog trenerów
          </Link>
        </Button>
      </div>

      {result.error && (
        <Card>
          <CardContent>
            <Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!result.error && trainers.length === 0 && (
        <Card>
          <CardContent>
            <div className="py-12 text-center text-gray-400">
              <p>Brak aktywnych współprac.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {trainers.length > 0 && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {trainers.map((trainer) => (
                <Link
                  key={trainer.key}
                  href={`/dashboard/trainers/${trainer.slug}`}
                  className="bg-dirty-blue hover:bg-hover group flex items-center justify-between rounded-xl p-5 text-left transition-all"
                >
                  <div className="w-[95%] text-sm">
                    <h2 className="text-gold mb-4 truncate text-lg">
                      {trainer.name}
                    </h2>
                    <div className="flex gap-2 text-xs text-gray-300">
                      <MapPin className="text-baby-blue h-3.5 w-3.5" />
                      <span className="mt-0.5 truncate">
                        {trainer.workplace}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-300 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
