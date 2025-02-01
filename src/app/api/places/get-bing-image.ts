import { redis } from "@/server/cache";
import { BingImageResponse } from "@/server/types";

export default async function getBingImage(urlQuery: string) {
  if (!process.env.BING_SECRET) {
    throw new Error("Bing API Key is not set");
  }
  const nameURL = new URLSearchParams([
    ["safeSearch", "moderate"],
    ["imageType", "photo"],
    ["size", "large"],
    ["count", "5"],
  ]);

  const data = await redis.get(urlQuery);

  if (data)
    return data as {
      data: { image: string; thumbnail: string };
      status: "success";
    };

  return fetch(
    `https://api.bing.microsoft.com/v7.0/images/search?${nameURL.toString()}&${urlQuery}`,
    {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.BING_SECRET,
        Accept: "application/json",
      },
    },
  )
    .then((response) => response.json())
    .then((data: BingImageResponse) => {
      if (data._type === "ErrorResponse")
        return { error: data.errors, type: "error" };
      if (!data.value) {
        console.error(urlQuery);
        console.error(JSON.stringify(data));
      }
      if (!data.value || data.value.length === 0)
        // TODO return a better empty value, although this is unlikely to happen
        return {
          data: {
            image: "",
            thumbnail: "",
          },
          type: "success",
        };
      return {
        data: {
          image: data.value[0].contentUrl,
          thumbnail: data.value[0].thumbnailUrl,
        },
        type: "success",
      };
    });
}
