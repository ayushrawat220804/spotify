declare module 'howler' {
  interface HowlOptions {
    src: string[];
    html5?: boolean;
    loop?: boolean;
    preload?: boolean;
    autoplay?: boolean;
    mute?: boolean;
    volume?: number;
    rate?: number;
    onload?: () => void;
    onloaderror?: (id: number, error: any) => void;
    onplay?: () => void;
    onend?: () => void;
    onpause?: () => void;
    onstop?: () => void;
    onmute?: () => void;
    onvolume?: () => void;
    onrate?: () => void;
    onseek?: () => void;
    onfade?: () => void;
    onplayerror?: (id: number, error: any) => void;
    format?: string[];
  }

  class Howl {
    constructor(options: HowlOptions);
    play(id?: number): number;
    pause(id?: number): this;
    stop(id?: number): this;
    mute(muted?: boolean, id?: number): this | boolean;
    volume(volume?: number, id?: number): this | number;
    fade(from: number, to: number, duration: number, id?: number): this;
    rate(rate?: number, id?: number): this | number;
    seek(seek?: number, id?: number): this | number;
    loop(loop?: boolean, id?: number): this | boolean;
    state(): 'unloaded' | 'loading' | 'loaded';
    playing(id?: number): boolean;
    duration(id?: number): number;
    on(event: string, callback: Function, id?: number): this;
    once(event: string, callback: Function, id?: number): this;
    off(event: string, callback?: Function, id?: number): this;
    load(): this;
    unload(): void;
  }

  class Howler {
    static volume(volume?: number): number | Howler;
    static mute(muted?: boolean): boolean | Howler;
  }

  export { Howl, Howler };
} 