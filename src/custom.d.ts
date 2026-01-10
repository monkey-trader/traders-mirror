declare module '*.module.css';
declare module '*.css';

declare global {
  interface Window {
    __BUILD_INFO__?: {
      branch?: string;
      sha?: string;
      tag?: string;
      time?: string;
    };
  }
}

export {};
