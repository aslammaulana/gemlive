export const apiKeys = [
  process.env.NEXT_PUBLIC_API_KEY1,
  process.env.NEXT_PUBLIC_API_KEY2,
  process.env.NEXT_PUBLIC_API_KEY3,
  process.env.NEXT_PUBLIC_API_KEY4,
  process.env.NEXT_PUBLIC_API_KEY5,
  process.env.NEXT_PUBLIC_API_KEY6,
  process.env.NEXT_PUBLIC_API_KEY7,
  process.env.NEXT_PUBLIC_API_KEY8,
  process.env.NEXT_PUBLIC_API_KEY9,
  process.env.NEXT_PUBLIC_API_KEY10,
].filter(Boolean) as string[];

// Ambil key secara berurutan, jika error maka ganti
let currentIndex = 0;

export function getApiKey() {
  return apiKeys[currentIndex];
}

export function switchApiKey() {
  currentIndex = (currentIndex + 1) % apiKeys.length;
  console.warn(`Switched to API key #${currentIndex + 1}`);
  return apiKeys[currentIndex];
}
