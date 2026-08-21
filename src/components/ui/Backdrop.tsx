import Image from "next/image";

export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <Image
        src="/4ace03a7-27c8-45c6-a5f2-8e304e1d67f4.webp"
        alt=""
        fill
        sizes="100vw"
        className="scale-110 object-cover opacity-80 blur-[1px]"
      />
    </div>
  );
}
