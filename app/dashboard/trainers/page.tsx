import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyTrainers } from "@/actions/my-trainers";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, MapPin } from "lucide-react";

export default async function TrainersPage() {
  const session = await auth();

  if (session?.user?.role !== "trainee") {
    redirect("/dashboard");
  }

  const result = await getMyTrainers();
  const trainers = result.data ? result.data.map((cooperation) => ({
          key: cooperation.trainer_id,
          name: `${cooperation.trainer.user.name} ${cooperation.trainer.user.surname}`,
          workplace: `${cooperation.workplace.name} - ul. ${cooperation.workplace.street} ${cooperation.workplace.building_number}${cooperation.workplace.flat_number ? `/${cooperation.workplace.flat_number}` : ""}, ${cooperation.workplace.city}`,
          slug: cooperation.trainer.slug,
        }))
      : [];

  if (!result.error && trainers.length === 1) {
    redirect(`/dashboard/trainers/${trainers[0].slug}`);
  }

  return (
    <div className="p-3">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-5 gap-6">
        <h1 className="text-2xl font-michroma md:ml-1">Twoi trenerzy</h1>

        <Button variant="secondary" className="border border-baby-blue flex w-[185px] gap-2 text-xs font-michroma">
          <BookOpen className="shrink-0" />
          Katalog trenerów
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
          <div className="text-center py-12 text-gray-400">
          <p>Brak aktywnych współprac.</p>
        </div>
        </CardContent>
        </Card>
      )}

      {trainers.length > 0 && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
              {trainers.map((trainer) => (
                <Link
                  key={trainer.key}
                  href={`/dashboard/trainers/${trainer.slug}`}
                  className="bg-dirty-blue hover:bg-hover group flex justify-between items-center rounded-xl p-5 text-left transition-all"
                >
                  <div className="text-sm w-[95%]">
                    <h2 className="text-lg text-gold truncate mb-4">{trainer.name}</h2>
                    <div className="flex gap-2 text-gray-300 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-baby-blue" />
                        <span className="truncate mt-0.5">{trainer.workplace}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}