"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface LocationContextType {
  locations: Location[];
  currentLocationId: string | null;
  setCurrentLocationId: (id: string) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLocations() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setLocations([]);
          setCurrentLocationId(null);
          setIsLoading(false);
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/locations`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setLocations(data);

          if (data.length > 0) {
            // Retrieve stored location
            const stored = localStorage.getItem("swan_location_id");
            const found = data.find((l: Location) => l.id === stored);

            if (found) {
              setCurrentLocationId(found.id);
            } else {
              // Default to first accessible location
              setCurrentLocationId(data[0].id);
              localStorage.setItem("swan_location_id", data[0].id);
              document.cookie = `swan_location_id=${data[0].id}; path=/; max-age=31536000`;
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch locations", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Initial fetch
    fetchLocations();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchLocations();
      } else if (event === "SIGNED_OUT") {
        setLocations([]);
        setCurrentLocationId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSetLocation = (id: string) => {
    setCurrentLocationId(id);
    localStorage.setItem("swan_location_id", id);
    document.cookie = `swan_location_id=${id}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <LocationContext.Provider
      value={{
        locations,
        currentLocationId,
        setCurrentLocationId: handleSetLocation,
        isLoading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
