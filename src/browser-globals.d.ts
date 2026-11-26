/** The app loads the Firebase 10 compat SDK and ZXing as classic scripts. */
declare const firebase: typeof import("firebase/compat/app").default;
interface Window {
  VD_FIREBASE?: Record<string, string>;
  VD_REGION?: string;
  ZXing?: {
    BarcodeFormat: Record<string, number>;
    DecodeHintType: Record<string, number>;
    MultiFormatReader: new () => {
      setHints(hints: Map<number, unknown>): void;
      decode(bitmap: unknown): { getText(): string };
      reset(): void;
    };
    HTMLCanvasElementLuminanceSource: new (canvas: HTMLCanvasElement) => object;
    HybridBinarizer: new (source: object) => object;
    BinaryBitmap: new (binarizer: object) => object;
  };
  webkitAudioContext?: typeof AudioContext;
  BarcodeDetector?: typeof BarcodeDetector;
}
declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  static getSupportedFormats(): Promise<string[]>;
  detect(input: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
