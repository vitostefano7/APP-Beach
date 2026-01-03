import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import API_URL from "../../../../../config/api";

/* =========================
   ADDRESS
========================= */

export function debounce(
  callback: (...args: any[]) => void,
  delay: number
) {
  let timeout: any;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}

/* =========================
   IMMAGINI
========================= */

export async function pickImages(
  selectedImages: string[],
  setSelectedImages: (v: string[]) => void
) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permesso negato");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: 10 - selectedImages.length,
    quality: 0.8,
  });

  if (!result.canceled && result.assets) {
    setSelectedImages([
      ...selectedImages,
      ...result.assets.map((a) => a.uri),
    ]);
  }
}

export function moveImageUp(
  index: number,
  images: string[],
  setImages: (v: string[]) => void
) {
  if (index === 0) return;
  const copy = [...images];
  [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
  setImages(copy);
}

export function removeImage(
  uri: string,
  images: string[],
  setImages: (v: string[]) => void
) {
  setImages(images.filter((i) => i !== uri));
}

/* =========================
   API HELPERS
========================= */

export async function searchAddress(query: string) {
  const res = await fetch(
    `${API_URL}/strutture/search-address?query=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Errore autocomplete");
  return res.json();
}

export async function uploadImages(
  strutturaId: string,
  images: string[],
  token: string
) {
  for (const imageUri of images) {
    const ext = imageUri.split(".").pop();
    const formData = new FormData();

    formData.append("image", {
      uri:
        Platform.OS === "android"
          ? imageUri
          : imageUri.replace("file://", ""),
      type: `image/${ext === "jpg" ? "jpeg" : ext}`,
      name: `photo-${Date.now()}.${ext}`,
    } as any);

    const res = await fetch(
      `${API_URL}/strutture/${strutturaId}/images`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    if (!res.ok) throw new Error("Errore upload immagini");
  }
}