/// <reference types="vite/client" />
/// <reference types="vite-imagetools/client" />

declare module '*?webp' {
  const src: string;
  export default src;
}

declare module '*?format=webp' {
  const src: string;
  export default src;
}
