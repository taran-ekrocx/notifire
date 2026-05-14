export async function generateArticleImage(title: string) {
  const prompt = encodeURIComponent(title);

  return `https://image.pollinations.ai/prompt/${prompt}`;
}