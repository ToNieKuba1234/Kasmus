// utils/getYoutubeLink.ts
export default async function getYoutubeLink(query: string): Promise<string | null> {
  if (!query) return null;

  try {
    console.log("Fetching YouTube search for:", query);

    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " Official Audio")}`
    );

    const text = await response.text();

    console.log("Response text snippet:", text.slice(0, 500));

    const regex = /\/watch\?v=[\w-]{11}/g;
    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) {
      console.warn("No video links found in YouTube search page.");
      return null;
    }

    const firstMatch = matches[0][0];
    const videoLink = `https://www.youtube.com${firstMatch}`;

    console.log("Found video link:", videoLink);

    return videoLink;
  } catch (error) {
    console.error("Error fetching YouTube link:", error);
    return null;
  }
}
