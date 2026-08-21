import { describe, expect, it } from "vitest";
import { videoEmbedUrl } from "../video";

describe("videoEmbedUrl", () => {
  it("YouTube watch URL jadi embed URL", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("YouTube short URL jadi embed URL", () => {
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("YouTube shorts URL jadi embed URL", () => {
    expect(videoEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("Vimeo URL jadi player URL", () => {
    expect(videoEmbedUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871"
    );
  });

  it("Vimeo /video/ URL jadi player URL", () => {
    expect(videoEmbedUrl("https://vimeo.com/video/76979871")).toBe(
      "https://player.vimeo.com/video/76979871"
    );
  });

  it("path upload lokal return null", () => {
    expect(videoEmbedUrl("/uploads/videos/abc.mp4")).toBeNull();
  });

  it("URL biasa return null", () => {
    expect(videoEmbedUrl("https://example.com/foo")).toBeNull();
  });

  it("string kosong return null", () => {
    expect(videoEmbedUrl("")).toBeNull();
  });
});
