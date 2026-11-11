/** Dable SDK command queue, set up by the inline loader in `components/common/dable-ad.tsx`. */
interface Window {
  dable?: (...args: string[]) => void
}
