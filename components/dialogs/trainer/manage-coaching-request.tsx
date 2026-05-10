"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Loader2, Inbox, MapPin } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


import { acceptRequest, rejectRequest } from "@/actions/coaching-request";
import { string } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Request = {
  traineeId: string;
  workplaceId: string;
  name: string;
  message: string | null;
  createdAt: Date;
  workplace: string;
};

export function ManageCoachingRequestsDialog({ requests, error }: { requests: Request[], error: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAccept = (traineeId: string, workplaceId: string) => {
    setLoadingId(traineeId);
    startTransition(async () => {
      const result = await acceptRequest(traineeId, workplaceId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Zaakceptowano nową współpracę!");
        if (requests.length === 1) setOpen(false);
      }
      setLoadingId(null);
    });
  };

  const handleReject = (traineeId: string) => {
    if (!confirm("Czy na pewno chcesz odrzucić tę prośbę?")) return;
    
    setLoadingId(traineeId);
    startTransition(async () => {
      const result = await rejectRequest(traineeId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Prośba została odrzucona.");
        if (requests.length === 1) setOpen(false);
      }
      setLoadingId(null);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex gap-2 relative font-michroma text-xs w-[210px] ">
            <Inbox/>
          Prośby o współpracę
          {requests.length > 0 && (
            <span className="bg-gold font-bold text-[10px] flex items-center  justify-center w-6 h-6 rounded-full absolute -top-3 -right-2 border-2 border-baby-blue">
              {requests.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-baby-blue font-michroma">Oczekujące prośby</DialogTitle>
        </DialogHeader>

{error ? (<Alert variant="destructive" className="mx-auto my-12">
              <AlertDescription>{error}</AlertDescription>
            </Alert>) : (<div className="overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-2">
              <Inbox size={40} className="opacity-20" />
              <p className="text-sm">Brak nowych próśb o współpracę.</p>
            </div>
          ) : (
            requests.map((req) => {
              const isCurrentLoading = isPending && loadingId === req.traineeId;

              return (
                <div key={req.traineeId} className="bg-dirty-blue border border-baby-blue rounded-xl p-4 space-y-3">
                  
                   
                      <p className="text-gold font-michroma text-sm mb-1">{req.name}</p>
                      <p className="text-xs text-zinc-400">
                        {format(new Date(req.createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}
                      </p>
                   
                 <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-baby-blue"/><span className="text-sm">{req.workplace}</span>
                 </div>
                    
                 

                  {req.message && (
                    <div className="bg-dirty-navy/50 rounded-md p-3 text-xs text-zinc-300 italic break-words">
                      "{req.message}"
                    </div>
                  )}


                  <div className="flex gap-2 justify-center pt-1">
                    <Button
                      size="sm"
                      className="text-red-400  bg-red-400/20 hover:bg-red-400/40 border border-red-400"
                      onClick={() => handleReject(req.traineeId)}
                      disabled={isPending}
                    >
                      {isCurrentLoading ? <Loader2 className="animate-spin" /> : <X/>}
                      Odrzuć
                    </Button>

                    <Button
                      size="sm"
                      className="text-emerald-400 bg-emerald-500/20  hover:bg-emerald-500/40  border border-emerald-500"
                      onClick={() => handleAccept(req.traineeId, req.workplaceId)}
                      disabled={isPending}
                    >
                      {isCurrentLoading ? <Loader2 className="animate-spin"/> : <Check/>}
                      Akceptuj
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>)}
        
      </DialogContent>
    </Dialog>
  );
}