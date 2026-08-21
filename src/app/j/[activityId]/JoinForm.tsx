"use client";

import { useActionState } from "react";
import { registerParticipant } from "./actions";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmailField } from "./EmailField";

type State = { error?: string };

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="label-eyebrow mb-3 text-ink-secondary">{legend}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

export function JoinForm({ activityId }: { activityId: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    registerParticipant,
    {}
  );

  return (
    <form action={formAction} className="space-y-7">
      <input type="hidden" name="activityId" value={activityId} />
      <Fieldset legend="Data diri">
        <TextField label="Nama peserta" name="nama" required minLength={3} />
        <TextField
          label="Nama badan usaha jasa konstruksi"
          name="badanUsaha"
          required
          minLength={3}
        />
      </Fieldset>
      <Fieldset legend="Legal & kontak">
        <TextField label="NPWP badan usaha" name="npwp" required minLength={5} />
        <TextField label="No WA" name="wa" required minLength={8} />
        <EmailField />
        <p className="text-[13px] leading-relaxed text-ink-secondary">
          Data hanya digunakan untuk keperluan pelatihan dan penerbitan
          sertifikat.
        </p>
      </Fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isGapensiMember"
          className="size-4 accent-accent"
        />
        Anggota Gapensi
      </label>
      {state.error ? (
        <p
          role="alert"
          className="border border-flag/30 bg-flag/5 px-3 py-2 text-sm font-medium text-flag"
        >
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Mendaftarkan…" : "Daftar Peserta"}
      </Button>
    </form>
  );
}
