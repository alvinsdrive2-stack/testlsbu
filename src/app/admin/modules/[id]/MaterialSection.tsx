"use client";

import { useActionState } from "react";
import type { Material } from "@prisma/client";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
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

export function MaterialSection({
  moduleId,
  materials,
}: {
  moduleId: string;
  materials: Material[];
}) {
  return (
    <section>
      <div className="mb-4 border-b border-hairline pb-2">
        <h2 className="text-h2 font-bold">Materi</h2>
      </div>

      <div className="mt-4 space-y-4">
        {materials.map((m, i) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-secondary">Materi {i + 1}</p>
              <ActionForm
                action={deleteMaterial}
                inputs={{ materialId: m.id, moduleId }}
                successMessage="Materi dihapus"
              >
                <ConfirmButton label="Hapus" />
              </ActionForm>
            </div>
            <EditMaterialForm material={m} />
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <CreateMaterialForm moduleId={moduleId} />
      </Card>
    </section>
  );
}
