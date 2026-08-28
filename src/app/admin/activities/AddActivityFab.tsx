"use client";

import { useState } from "react";
import { AddFab, Modal } from "@/components/ui/Modal";
import { CreateActivityForm } from "./CreateActivityForm";

export function AddActivityFab({
  modules,
}: {
  modules: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AddFab label="Tambah kegiatan baru" onClick={() => setOpen(true)} />

      <Modal
        label="Tambah kegiatan baru"
        title="Kegiatan baru"
        open={open}
        onClose={() => setOpen(false)}
      >
        <CreateActivityForm modules={modules} variant="quick" />
      </Modal>
    </>
  );
}
