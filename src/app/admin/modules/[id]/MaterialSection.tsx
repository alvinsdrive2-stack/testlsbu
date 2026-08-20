import type { Material } from "@prisma/client";
import { createMaterial, updateMaterial, deleteMaterial } from "../actions";
import { Card } from "@/components/ui/Card";
import { TextArea, TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function MaterialSection({
  moduleId,
  materials,
}: {
  moduleId: string;
  materials: Material[];
}) {
  return (
    <section>
      <h2 className="text-h1 font-semibold">Materi</h2>

      <div className="mt-4 space-y-4">
        {materials.map((m, i) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-secondary">Materi {i + 1}</p>
              <form action={deleteMaterial}>
                <input type="hidden" name="materialId" value={m.id} />
                <input type="hidden" name="moduleId" value={moduleId} />
                <Button variant="danger" type="submit">
                  Hapus
                </Button>
              </form>
            </div>
            <form action={updateMaterial} className="mt-2 space-y-3">
              <input type="hidden" name="materialId" value={m.id} />
              <input type="hidden" name="moduleId" value={moduleId} />
              <TextField
                label="Judul"
                name="title"
                defaultValue={m.title}
                required
                minLength={3}
              />
              <TextArea label="Konten" name="content" defaultValue={m.content} required />
              <TextField
                label="URL video (opsional)"
                name="videoUrl"
                type="url"
                defaultValue={m.videoUrl ?? ""}
              />
              <Button variant="secondary" type="submit">
                Simpan Materi
              </Button>
            </form>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <form action={createMaterial} className="space-y-3">
          <input type="hidden" name="moduleId" value={moduleId} />
          <TextField label="Judul materi baru" name="title" required minLength={3} />
          <TextArea label="Konten" name="content" required />
          <TextField label="URL video (opsional)" name="videoUrl" type="url" />
          <Button type="submit">Tambah Materi</Button>
        </form>
      </Card>
    </section>
  );
}
