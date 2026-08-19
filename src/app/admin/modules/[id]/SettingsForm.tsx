"use client";

import { useState } from "react";
import { updateModuleSettings } from "../actions";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Settings = {
  id: string;
  title: string;
  description: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  pretestDurationMin: number;
  posttestDurationMin: number;
  pretestPassingGrade: number;
  posttestPassingGrade: number;
};

export function SettingsForm({ module }: { module: Settings }) {
  const [sq, setSq] = useState(module.shuffleQuestions);
  const [so, setSo] = useState(module.shuffleOptions);

  return (
    <Card className="p-6">
      <p className="text-h2 font-semibold">Pengaturan Ujian</p>
      <form action={updateModuleSettings} className="mt-4 space-y-4">
        <input type="hidden" name="moduleId" value={module.id} />
        <TextField
          label="Judul"
          name="title"
          defaultValue={module.title}
          required
          minLength={3}
        />
        <TextField
          label="Deskripsi"
          name="description"
          defaultValue={module.description ?? ""}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Durasi pretest (menit)"
            name="pretestDurationMin"
            type="number"
            min={1}
            max={480}
            defaultValue={module.pretestDurationMin}
          />
          <TextField
            label="Durasi posttest (menit)"
            name="posttestDurationMin"
            type="number"
            min={1}
            max={480}
            defaultValue={module.posttestDurationMin}
          />
          <TextField
            label="Passing grade pretest"
            name="pretestPassingGrade"
            type="number"
            min={0}
            max={100}
            defaultValue={module.pretestPassingGrade}
          />
          <TextField
            label="Passing grade posttest"
            name="posttestPassingGrade"
            type="number"
            min={0}
            max={100}
            defaultValue={module.posttestPassingGrade}
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="shuffleQuestions"
              checked={sq}
              onChange={(e) => setSq(e.target.checked)}
              className="size-4 accent-[#002b66]"
            />
            Acak urutan soal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="shuffleOptions"
              checked={so}
              onChange={(e) => setSo(e.target.checked)}
              className="size-4 accent-[#002b66]"
            />
            Acak urutan opsi jawaban
          </label>
        </div>
        <Button type="submit">Simpan</Button>
      </form>
    </Card>
  );
}
