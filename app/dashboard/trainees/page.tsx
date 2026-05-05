import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TraineesList from "@/components/pages/my-trainees/trainees-list";
import { getMyTrainees } from "@/actions/my-trainees";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function TraineesPage() {
  const session = await auth();

  if (session?.user?.role !== "trainer") {
    redirect("/dashboard");
  }

  const result = await getMyTrainees();

  const mappedTrainees = result.data?.map((cooperation) => ({
    key: cooperation.trainee.id,
    name: `${cooperation.trainee.user.name} ${cooperation.trainee.user.surname}`,
    workplace: `${cooperation.workplace.name} - ul. ${cooperation.workplace.street}, ${cooperation.workplace.city}`,
  })) ?? [];

  return (
    <div className="min-h-screen p-3">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-5 gap-6">
        <h1 className="text-2xl font-michroma md:ml-1">Podopieczni <span>({mappedTrainees.length})</span></h1>
        
        <Button className="flex items-center gap-3">
          Prośby o współpracę
          <span className="bg-dirty-navy text-white text-xs flex items-center justify-center w-6 h-6 rounded-full font-sans">
            1
          </span>
        </Button>
      </div>

      <Card>
        <CardContent className="md:px-4">
          {result.error ? (
            <Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          ) : (
            <TraineesList initialTrainees={mappedTrainees} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}