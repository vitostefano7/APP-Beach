import API_URL from "../../../../../config/api";
import { SportData } from "../types/CreaStruttura.types";

export async function searchAddress(query: string) {
  const res = await fetch(
    `${API_URL}/strutture/search-address?query=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Errore autocomplete");
  return res.json();
}

export async function fetchSports(): Promise<SportData[]> {
  const res = await fetch(`${API_URL}/sports`);
  if (!res.ok) throw new Error("Errore caricamento sport");
  const data = await res.json();
  return data.success ? data.data : [];
}

export async function createStruttura(data: any, token: string) {
  const res = await fetch(`${API_URL}/strutture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Errore creazione struttura");
  }

  return res.json();
}

export async function createCampi(strutturaId: string, campi: any[], token: string) {
  console.log("=== DEBUG API createCampi ===");
  console.log("strutturaId:", strutturaId);
  console.log("campi ricevuti:", JSON.stringify(campi, null, 2));
  console.log("===========================");
  
  const res = await fetch(`${API_URL}/campi`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ strutturaId, campi }),
  });

  console.log("📊 Response status:", res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log("❌ Errore response completo:", errorText);
    
    try {
      const err = JSON.parse(errorText);
      console.log("❌ Errore JSON:", err);
      throw new Error(err.message || "Errore creazione campi");
    } catch (parseError) {
      console.log("❌ Errore parsing JSON:", parseError);
      throw new Error(`Errore creazione campi: ${errorText}`);
    }
  }

  const result = await res.json();
  console.log("✅ Risposta backend:", JSON.stringify(result, null, 2));
  return result;
}

export async function uploadStrutturaImages(
  strutturaId: string,
  images: string[],
  token: string
) {
  for (const imageUri of images) {
    const formData = new FormData();
    const ext = imageUri.split(".").pop();

    formData.append("image", {
      uri: imageUri,
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