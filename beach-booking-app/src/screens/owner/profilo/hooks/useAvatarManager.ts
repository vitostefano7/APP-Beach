import { useCallback, useEffect, useState } from "react";
import API_URL from "../../../../config/api";
import { User } from "../types";

interface AlertButton {
  text: string;
  style: "default" | "cancel" | "destructive";
}

interface ShowAlertPayload {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  buttons: AlertButton[];
}

interface UseAvatarManagerParams {
  token: string | null;
  user: User | null;
  updateUser: ((updatedUser: Partial<User>) => void) | null;
  showAlert: (payload: ShowAlertPayload) => void;
  fetchProfile: () => Promise<User | undefined>;
}

export const useAvatarManager = ({
  token,
  user,
  updateUser,
  showAlert,
  fetchProfile,
}: UseAvatarManagerParams) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
      setAvatarError(false);
    }
  }, [user?.avatarUrl]);

  const validateImage = (size: number): boolean => {
    const maxSize = 5 * 1024 * 1024;
    return size <= maxSize;
  };

  const uploadAvatar = useCallback(
    async (imageUri: string) => {
      if (!token) {
        showAlert({
          type: "error",
          title: "Errore",
          message: "Token non disponibile",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }

      try {
        setUploading(true);
        const response = await fetch(imageUri);
        const blob = await response.blob();

        if (!validateImage(blob.size)) {
          showAlert({
            type: "warning",
            title: "Immagine troppo grande",
            message: "L'immagine deve essere massimo 5MB",
            buttons: [{ text: "OK", style: "default" }],
          });
          return;
        }

        const formData = new FormData();
        const filename = imageUri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append(
          "avatar",
          {
            uri: imageUri,
            name: filename,
            type,
          } as any
        );

        const res = await fetch(`${API_URL}/users/me/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const json = await res.json();

        if (res.ok) {
          const newAvatarUrl = json.avatarUrl;
          setAvatarUrl(newAvatarUrl);
          setAvatarError(false);
          setAvatarRefreshKey((prev) => prev + 1);

          if (updateUser && user) {
            updateUser({ ...user, avatarUrl: newAvatarUrl });
          }

          await fetchProfile();

          showAlert({
            type: "success",
            title: "Perfetto!",
            message: "La tua immagine profilo è stata aggiornata con successo",
            buttons: [{ text: "OK", style: "default" }],
          });
        } else {
          showAlert({
            type: "error",
            title: "Ops!",
            message: json.message || "Non siamo riusciti a caricare l'immagine. Riprova.",
            buttons: [{ text: "OK", style: "default" }],
          });
        }
      } catch (error) {
        console.error("Upload avatar error:", error);
        showAlert({
          type: "error",
          title: "Errore di connessione",
          message: "Verifica la tua connessione internet e riprova",
          buttons: [{ text: "OK", style: "default" }],
        });
      } finally {
        setUploading(false);
      }
    },
    [token, user, updateUser, showAlert, fetchProfile]
  );

  const removeAvatar = useCallback(async () => {
    if (!token) {
      showAlert({
        type: "error",
        title: "Errore",
        message: "Token non disponibile",
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    try {
      setUploading(true);
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAvatarUrl(null);
        setAvatarError(false);
        setAvatarRefreshKey((prev) => prev + 1);

        if (updateUser && user) {
          updateUser({ ...user, avatarUrl: undefined });
        }

        await fetchProfile();

        showAlert({
          type: "success",
          title: "Fatto!",
          message: "La tua immagine profilo è stata rimossa",
          buttons: [{ text: "OK", style: "default" }],
        });
      } else {
        showAlert({
          type: "error",
          title: "Ops!",
          message: "Non siamo riusciti a rimuovere l'immagine",
          buttons: [{ text: "OK", style: "default" }],
        });
      }
    } catch (error) {
      console.error("Remove avatar error:", error);
      showAlert({
        type: "error",
        title: "Errore",
        message: "Non siamo riusciti a rimuovere l'immagine",
        buttons: [{ text: "OK", style: "default" }],
      });
    } finally {
      setUploading(false);
    }
  }, [token, user, updateUser, showAlert, fetchProfile]);

  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);

  return {
    avatarUrl,
    avatarError,
    avatarRefreshKey,
    uploading,
    uploadAvatar,
    removeAvatar,
    handleAvatarError,
  };
};
