import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReservationMap from "@/pages/ReservationMap";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ReservationMap />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
