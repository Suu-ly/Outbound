import { redis } from "@/server/cache";
import { supabase } from "@/server/supabase";
import { ApiResponse, GoogleError, ImageReturn } from "@/server/types";
import crypto from "node:crypto";
import sharp from "sharp";

type GoogleImageResponse =
  | {
      items: {
        link: string;
        mime: string;
        image: {
          contextLink: string;
          height: number;
          width: number;
          byteSize: number;
          thumbnailLink: string;
          thumbnailHeight: number;
          thumbnailWidth: number;
        };
      }[];
    }
  | GoogleError;

if (!process.env.GOOGLE_SEARCH_SECRET || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
  throw new Error("Google Image Search API Keys are not set");
}

const searchParams = new URLSearchParams([
  ["cx", process.env.GOOGLE_SEARCH_ENGINE_ID],
  ["fields", "items.link,items.image,items.mime"],
  ["imgType", "photo"],
  ["num", "1"],
  ["searchType", "image"],
  ["key", process.env.GOOGLE_SEARCH_SECRET],
]);

export default async function getGoogleImage(
  urlQuery: string,
  minSize: [number, number] = [144, 176],
): Promise<ApiResponse<ImageReturn>> {
  // Check cache
  const redisData = await redis.get<{
    data: { image: string; thumbnail: string };
    status: "success";
  }>(urlQuery);

  if (redisData) return redisData;

  const data = await fetch(
    `https://customsearch.googleapis.com/customsearch/v1?${urlQuery + "%20filetype:jpeg%20OR%20filetype:png%20OR%20filetype:bmp%20OR%20filetype:webP"}&${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  )
    .then((response) => response.json())
    .then((data) => data as GoogleImageResponse);

  if ("error" in data)
    return {
      message: data.error.message ?? "Something went wrong",
      status: "error",
    };
  if (!data.items || data.items.length === 0) {
    console.error("No image found:", urlQuery);
    // TODO return a better empty value, although this is unlikely to happen
    return {
      data: {
        image: "",
        thumbnail: "",
      },
      status: "success",
    };
  }

  const item = data.items[0];
  try {
    const imageBuffer = await fetch(data.items[0].link).then((res) =>
      res.arrayBuffer(),
    );
    const resized = await sharp(imageBuffer)
      .resize(
        item.image.width / item.image.height < minSize[0] / minSize[1] // Max size of displayed image. Make sure image is at least enough to cover
          ? { width: minSize[0] + 24 }
          : { height: minSize[1] + 24 },
      )
      .toFormat("jpeg")
      .toBuffer();
    const fileName = `${crypto.hash("sha256", urlQuery)}.jpeg`;
    const { data: storageData, error } = await supabase.storage
      .from("place-thumbnails")
      .upload(fileName, resized, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error || !storageData) {
      console.error(error.message);
      return { message: error.message, status: "error" };
    }

    const { data: path } = supabase.storage
      .from("place-thumbnails")
      .getPublicUrl(fileName);

    const result: ApiResponse<ImageReturn> = {
      data: {
        image: item.link,
        thumbnail: path.publicUrl,
      },
      status: "success",
    };

    await redis.set(urlQuery, result, { ex: 2629746 }); //6 months

    return result;
  } catch (e) {
    console.error(e);
    // Fallback to google provided thumbnail if resizing fails
    return {
      status: "success",
      data: {
        image: item.link,
        thumbnail: item.image.thumbnailLink,
      },
    };
  }
}
