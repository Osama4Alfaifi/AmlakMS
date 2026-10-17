// Stand-in for "firebase/app" in the static demo build (see next.config.ts).
export interface FirebaseApp {
  readonly name: string;
}
const APP: FirebaseApp = { name: "[demo]" };
export function initializeApp(): FirebaseApp {
  return APP;
}
export function getApps(): FirebaseApp[] {
  return [APP];
}
