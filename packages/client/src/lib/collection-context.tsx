import { createContext, useContext, useMemo } from "react";
import { Navigate, Outlet, useParams } from "react-router";
import type { Collection, Flag } from "@flag-quiz/shared";
import { getCollection } from "@flag-quiz/shared";
import { flagImageUrl } from "./flag-image";

interface CollectionContextValue {
  collection: Collection;
  flagByCode: (code: string) => Flag | undefined;
  imageUrl: (codeOrFlag: string | Flag) => string;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function useActiveCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx) {
    throw new Error("useActiveCollection must be used inside a CollectionLayout route");
  }
  return ctx;
}

export function CollectionProvider({
  collection,
  children,
}: {
  collection: Collection;
  children: React.ReactNode;
}) {
  const value = useMemo<CollectionContextValue>(() => {
    const byCode = new Map(collection.flags.map((f) => [f.code, f]));
    return {
      collection,
      flagByCode: (code: string) => byCode.get(code),
      imageUrl: (codeOrFlag: string | Flag) => {
        if (typeof codeOrFlag === "string") {
          const f = byCode.get(codeOrFlag);
          if (!f) return `/flags/${collection.id}/${codeOrFlag}.png`;
          return flagImageUrl(collection.id, f);
        }
        return flagImageUrl(collection.id, codeOrFlag);
      },
    };
  }, [collection]);

  return (
    <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
  );
}

export function CollectionLayout() {
  const { collection: slug } = useParams<{ collection: string }>();
  const collection = slug ? getCollection(slug) : undefined;

  if (!collection) {
    return <Navigate to="/" replace />;
  }

  return (
    <CollectionProvider collection={collection}>
      <Outlet />
    </CollectionProvider>
  );
}
