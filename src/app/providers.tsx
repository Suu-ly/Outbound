"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import {
  isServer,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Provider } from "jotai";
import { useEffect } from "react";

import { toast } from "sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (error.message)
          toast.error(`Something went wrong: ${error.message}`, {
            id: error.name,
          });
        else if (query.meta?.errorMessage)
          toast.error(`Something went wrong: ${query.meta.errorMessage}`, {
            id: error.name,
          });
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

const CookieRefresh = () => {
  useEffect(() => {
    const loadSession = async () => {
      await authClient.getSession();
    };
    loadSession();
  }, []);
  return null;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={400}>
        <Provider>
          <CookieRefresh />
          {children}
        </Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
