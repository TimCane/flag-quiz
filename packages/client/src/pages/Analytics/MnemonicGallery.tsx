import { Link } from "react-router";
import type { Flag } from "@flag-quiz/shared";
import { FlagDisplay } from "../../components/game/FlagDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

interface MnemonicEntry {
  code: string;
  mnemonic: string | undefined;
  flag: Flag | undefined;
}

export function MnemonicGallery({ mnemonics }: { mnemonics: MnemonicEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Mnemonic Gallery
          <span className="ml-2 text-sm font-normal text-surface-500">({mnemonics.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mnemonics.length === 0 ? (
          <div className="text-sm text-surface-500">No mnemonics recorded yet</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mnemonics.map((m) => (
              <Link
                key={m.code}
                to={`/history/${m.code}`}
                className="flex items-start gap-3 rounded-xl border border-surface-800/80 bg-surface-800/20 p-3.5 transition-all duration-200 hover:border-surface-700 hover:bg-surface-800/40 glow-border"
              >
                <FlagDisplay code={m.code} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-surface-300">{m.flag!.name}</div>
                  <div className="mt-0.5 text-xs italic text-surface-500">{m.mnemonic}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
