import { Response } from "express";
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import UserPreferences from "../models/UserPreferences";
import PaymentMethod from "../models/PaymentMethod";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * GET /users/me/profile
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const [user, profile, preferences, payments] = await Promise.all([
      User.findById(userId).select("-password"),
      PlayerProfile.findOne({ user: userId }).populate("favoriteCampo"),
      UserPreferences.findOne({ user: userId }),
      PaymentMethod.find({ user: userId }),
    ]);

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.json({
      user,
      profile,
      preferences,
      payments,
    });
  } catch (error) {
    console.error("getMyProfile error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /users/me/profile
 */
export const updatePlayerProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { level, favoriteCampo } = req.body;

    const profile = await PlayerProfile.findOneAndUpdate(
      { user: userId },
      { level, favoriteCampo },
      { new: true }
    ).populate("favoriteCampo");

    res.json(profile);
  } catch (error) {
    console.error("updatePlayerProfile error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /users/me/preferences
 */
export const updatePreferences = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const preferences = await UserPreferences.findOneAndUpdate(
      { user: userId },
      req.body,
      { new: true }
    );

    res.json(preferences);
  } catch (error) {
    console.error("updatePreferences error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /users/me
 */
export const updateMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: req.body.name,
        surname: req.body.surname,
        phone: req.body.phone,
        avatarUrl: req.body.avatarUrl,
      },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error("updateMe error", error);
    res.status(500).json({ message: "Errore server" });
  }
};
