import { redis } from "@/server/cache";
import { ApiResponse, BingImageResponse, BingReturn } from "@/server/types";

export default async function getBingImage(
  urlQuery: string,
): Promise<ApiResponse<BingReturn>> {
  if (!process.env.BING_SECRET) {
    throw new Error("Bing API Key is not set");
  }
  const nameURL = new URLSearchParams([
    ["safeSearch", "moderate"],
    ["imageType", "photo"],
    ["size", "large"],
    ["count", "5"],
  ]);

  const redisData = await redis.get(urlQuery);

  if (redisData)
    return redisData as {
      data: { image: string; thumbnail: string };
      status: "success";
    };

  const data = await fetch(
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
    .then((data) => data as BingImageResponse);

  if (data._type === "ErrorResponse")
    return {
      message: data.errors[0] ? data.errors[0].message : "Something went wrong",
      status: "error",
    };
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
      status: "success",
    };

  const result = {
    data: {
      image: data.value[0].contentUrl,
      thumbnail: data.value[0].thumbnailUrl,
    },
    status: "success" as const,
  };

  await redis.set(urlQuery, result, { ex: 604800 });

  return result;
}
