import Link from "next/link";
import { getCatalogTrainers } from "@/actions/catalog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent} from "@/components/ui/card";
import { ChevronRight, MapPin, Star } from "lucide-react";
import { hasTrainerCooperation } from "@/actions/my-trainers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/common/back-button";

type TrainersCatalogPageProps = {
  searchParams?: Promise<{
    name?: string;
    city?: string;
  }>;
};

export default async function TrainersCatalogPage({ searchParams }: TrainersCatalogPageProps) {

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nameQuery = resolvedSearchParams?.name?.trim() ?? "";
  const cityQuery = resolvedSearchParams?.city?.trim() ?? "";
  const hasActiveFilters = nameQuery.length > 0 || cityQuery.length > 0;


  const [trainersResult, hasResult] = await Promise.all([
    getCatalogTrainers({ name: nameQuery, city: cityQuery }),
    hasTrainerCooperation(),
  ]);

  const pageError = trainersResult.error ?? hasResult.error;
  const trainers = trainersResult.data ?? [];
  const hasAnyCooperation = hasResult.data ?? false;


  return (
    <div className="p-3 space-y-4">
        {hasAnyCooperation && (
            <BackButton label="Wróć do moich trenerów"/>
            )}
      

      <h1 className="text-2xl font-michroma md:ml-1 text-center sm:text-left ">Katalog trenerów</h1>


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
            <div className="flex flex-col md:flex-row items-baseline justify-between">
                <p className="mx-auto md:mx-0 mb-6 text-baby-blue">Znajdź swojego przyszłego trenera</p>
            <form key={`${nameQuery}-${cityQuery}`} className=" gap-3 mb-6 mx-auto md:mx-0 flex flex-col md:flex-row w-full md:w-[50%]">
              <Input
                name="name"
                defaultValue={nameQuery}
                placeholder="Szukaj po imieniu i nazwisku"
                className="bg-dirty-blue rounded-xl   placeholder:text-zinc-400 "
              />
              <Input
                name="city"
                defaultValue={cityQuery}
                placeholder="Szukaj po mieście"
                className="bg-dirty-blue  rounded-xl  placeholder:text-zinc-400 "
              />
              <div className=" flex gap-2 justify-center">
                <Button
                  type="submit"
                >
                  Szukaj
                </Button>
                {hasActiveFilters && (
                  <Button
                    asChild
                    
                    className="bg-gold hover:bg-gold/60"
                  >
                    <Link href="/dashboard/trainers/catalog">Wyczyść filtry</Link>
                  </Button>
                )}
              </div>
            </form></div>
            
            {!pageError && trainers.length === 0 && (
       
            <div className="text-center py-12 text-gray-400">
              <p>
                {hasActiveFilters
                  ? "Brak trenerów pasujących do podanych filtrów."
                  : "Brak publicznych trenerów w systemie."}
              </p>
            </div>
     
      )}
          {!pageError && trainers.length > 0 && (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trainers.map((trainer) => (
                <Link
                  key={trainer.id}
                  href={`/dashboard/trainers/catalog/${trainer.slug}`}
                  className="bg-dirty-blue hover:bg-hover group flex justify-between items-center rounded-xl p-5 text-left transition-all"
                >
                  <div className="w-[95%] space-y-3">
                    <h2 className="text-lg text-gold truncate ">{trainer.name}</h2>
                    <div className="flex gap-2 text-gray-300 text-sm items-center">
                      <MapPin className="w-4 h-4 text-baby-blue shrink-0 " />
                      <span className="truncate mt-0.5">
                        {trainer.workplaces.length > 0
                          ? trainer.workplaces.join(", ")
                          : "Brak miejsc pracy"}
                      </span>
                    </div>
                    <div className="flex gap-2 text-gray-300 text-sm items-center">
                      <Star className="w-4 h-4 text-baby-blue shrink-0" />
                      <span className="">
                        {trainer.averageRate !== null
                          ? `Średnia ocen: ${trainer.averageRate}/5`
                          : "Brak opinii"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 transition-transform group-hover:translate-x-1 shrink-0" />
                </Link>
              ))}
            </div> )}
          </CardContent>
        </Card>
     
    </div>
  );
}
