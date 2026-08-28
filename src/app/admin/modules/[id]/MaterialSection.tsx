"use client";

import { useActionState, useState } from "react";
import type { Material } from "@prisma/client";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialContent,
} from "../actions";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { VideoField } from "./VideoField";
import { PdfField } from "./PdfField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { useActionToast } from "@/components/ui/useActionToast";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return <span className="text-sm text-flag">{error}</span>;
}

function EditMaterialForm({ material }: { material: Material }) {
  const [state, formAction] = useActionState(updateMaterial, {});
  useActionToast(state, { success: "Materi disimpan" });
  return (
    <form action={formAction} className="mt-2 space-y-3">
      <input type="hidden" name="materialId" value={material.id} />
      <input type="hidden" name="moduleId" value={material.moduleId} />
      <TextField
        label="Judul"
        name="title"
        defaultValue={material.title}
        required
        minLength={3}
      />
      <RichTextEditor label="Konten" name="content" defaultValue={material.content} />
      <VideoField defaultValue={material.videoUrl ?? ""} />
      <PdfField defaultValue={material.pdfUrl ?? ""} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary">Simpan Materi</SubmitButton>
        <ErrorNote error={state.error} />
      </div>
    </form>
  );
}

function CreateMaterialForm({ moduleId }: { moduleId: string }) {
  const [state, formAction] = useActionState(createMaterial, {});
  useActionToast(state, { success: "Materi ditambahkan" });
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="moduleId" value={moduleId} />
      <TextField label="Judul materi baru" name="title" required minLength={3} />
      <RichTextEditor label="Konten" name="content" />
      <VideoField />
      <PdfField />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Tambah Materi</SubmitButton>
        <ErrorNote error={state.error} />
      </div>
    </form>
  );
}

type MaterialMeta = Omit<Material, "content">;

function MaterialRow({
  material,
  index,
  moduleId,
}: {
  material: MaterialMeta;
  index: number;
  moduleId: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || content !== null || loadError) return;
    setLoadError(null);
    getMaterialContent(material.id).then((res) => {
      if ("content" in res) {
        setContent(res.content);
      } else {
        setLoadError(res.error);
      }
    });
  };

  return (
    <details className="group border-b border-hairline" onToggle={handleToggle}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="inline-block shrink-0 text-ink-secondary transition-transform group-open:rotate-90"
          >
            ▸
          </span>
          <span className="truncate text-[15px] font-semibold">
            {index + 1}. {material.title}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-ink-secondary">Edit</span>
          <ActionForm
            action={deleteMaterial}
            inputs={{ materialId: material.id, moduleId }}
            successMessage="Materi dihapus"
          >
            <ConfirmButton label="Hapus" />
          </ActionForm>
        </span>
      </summary>
      <div className="pb-5">
        {content === null ? (
          <p className="py-2 text-sm text-ink-secondary">
            {loadError ?? "Memuat konten…"}
          </p>
        ) : (
          <EditMaterialForm material={{ ...material, content }} />
        )}
      </div>
    </details>
  );
}

export function MaterialSection({
  moduleId,
  materials,
}: {
  moduleId: string;
  materials: MaterialMeta[];
}) {
  return (
    <section>
      <div className="mb-4 border-b border-hairline pb-2">
        <h2 className="text-h2 font-bold">Materi</h2>
      </div>

      <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-5">
        {materials.length === 0 ? (
          <p className="py-6 text-center text-[15px] text-ink-secondary">
            Belum ada materi. Tambah materi pertama di bawah.
          </p>
        ) : (
          materials.map((m, i) => (
            <MaterialRow key={m.id} material={m} index={i} moduleId={moduleId} />
          ))
        )}
      </div>

      <details className="group mt-4 rounded-[var(--radius-card)] border border-hairline bg-surface px-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 py-4 text-[15px] font-semibold text-accent [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden
            className="inline-block transition-transform group-open:rotate-90"
          >
            ▸
          </span>
          + Tambah materi baru
        </summary>
        <div className="pb-5">
          <CreateMaterialForm moduleId={moduleId} />
        </div>
      </details>
    </section>
  );
}
