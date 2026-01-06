import mongoose, { Schema, Types, HydratedDocument } from "mongoose";

/* =====================================================
   INTERFACCIA BASE
===================================================== */

export interface IFriendship {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "blocked";

  createdAt: Date;
  updatedAt: Date;

  acceptedAt?: Date;
  rejectedAt?: Date;
  blockedAt?: Date;

  blockedBy?: Types.ObjectId;
  blockReason?: string;
}

/* =====================================================
   DOCUMENTO IDRATATO
===================================================== */

export type FriendshipDocument = HydratedDocument<IFriendship>;

/* =====================================================
   SCHEMA
===================================================== */

const FriendshipSchema = new Schema<IFriendship>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
      index: true,
    },

    acceptedAt: Date,
    rejectedAt: Date,
    blockedAt: Date,

    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    blockReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

/* =====================================================
   INDICI
===================================================== */

FriendshipSchema.index(
  { requester: 1, recipient: 1 },
  { unique: true, name: "unique_friendship_pair" }
);

FriendshipSchema.index(
  { requester: 1, status: 1 },
  { name: "requester_status_index" }
);

FriendshipSchema.index(
  { recipient: 1, status: 1 },
  { name: "recipient_status_index" }
);

FriendshipSchema.index(
  { requester: 1, recipient: 1, status: 1 },
  { name: "friendship_lookup" }
);

/* =====================================================
   MIDDLEWARE (ASYNC, SENZA next)
===================================================== */

// ❌ Non puoi essere amico di te stesso
FriendshipSchema.pre("validate", async function (this: FriendshipDocument) {
  if (this.requester.equals(this.recipient)) {
    throw new Error("Non puoi inviare una richiesta di amicizia a te stesso");
  }
});

// 🔄 Aggiorna date in base allo stato
FriendshipSchema.pre("save", async function (this: FriendshipDocument) {
  if (!this.isModified("status")) return;

  const now = new Date();

  switch (this.status) {
    case "accepted":
      this.acceptedAt = now;
      this.rejectedAt = undefined;
      this.blockedAt = undefined;
      this.blockedBy = undefined;
      break;

    case "rejected":
      this.rejectedAt = now;
      this.acceptedAt = undefined;
      this.blockedAt = undefined;
      this.blockedBy = undefined;
      break;

    case "blocked":
      this.blockedAt = now;
      this.acceptedAt = undefined;
      this.rejectedAt = undefined;
      if (!this.blockedBy) {
        this.blockedBy = this.requester;
      }
      break;

    case "pending":
      this.acceptedAt = undefined;
      this.rejectedAt = undefined;
      this.blockedAt = undefined;
      this.blockedBy = undefined;
      break;
  }
});

/* =====================================================
   INSTANCE METHODS
===================================================== */

FriendshipSchema.methods.isMutual = async function (
  this: FriendshipDocument
): Promise<boolean> {
  if (this.status !== "accepted") return false;

  const inverse = await Friendship.findOne({
    requester: this.recipient,
    recipient: this.requester,
    status: "accepted",
  });

  return !!inverse;
};

FriendshipSchema.methods.getCounterparty = function (
  this: FriendshipDocument,
  userId: Types.ObjectId
): Types.ObjectId {
  if (this.requester.equals(userId)) return this.recipient;
  if (this.recipient.equals(userId)) return this.requester;

  throw new Error("L'utente non fa parte di questa amicizia");
};

/* =====================================================
   STATIC METHODS
===================================================== */

interface FriendshipStatics {
  findFriendsOfUser(
    userId: Types.ObjectId,
    options?: { limit?: number; skip?: number }
  ): Promise<FriendshipDocument[]>;

  countFriendsOfUser(userId: Types.ObjectId): Promise<number>;

  areFriends(
    user1Id: Types.ObjectId,
    user2Id: Types.ObjectId
  ): Promise<boolean>;

  findMutualFriends(
    user1Id: Types.ObjectId,
    user2Id: Types.ObjectId,
    limit?: number
  ): Promise<Types.ObjectId[]>;
}

FriendshipSchema.statics.findFriendsOfUser = function (
  userId: Types.ObjectId,
  options: { limit?: number; skip?: number } = {}
) {
  return this.find({
    $or: [
      { requester: userId, status: "accepted" },
      { recipient: userId, status: "accepted" },
    ],
  })
    .populate("requester", "name username avatarUrl")
    .populate("recipient", "name username avatarUrl")
    .sort({ acceptedAt: -1 })
    .skip(options.skip ?? 0)
    .limit(options.limit ?? 50);
};

FriendshipSchema.statics.countFriendsOfUser = function (userId: Types.ObjectId) {
  return this.countDocuments({
    $or: [
      { requester: userId, status: "accepted" },
      { recipient: userId, status: "accepted" },
    ],
  });
};

FriendshipSchema.statics.areFriends = async function (
  user1Id: Types.ObjectId,
  user2Id: Types.ObjectId
) {
  const friendship = await this.findOne({
    $or: [
      { requester: user1Id, recipient: user2Id, status: "accepted" },
      { requester: user2Id, recipient: user1Id, status: "accepted" },
    ],
  });

  return !!friendship;
};

FriendshipSchema.statics.findMutualFriends = async function (
  user1Id: Types.ObjectId,
  user2Id: Types.ObjectId,
  limit = 10
) {
  const user1Friendships = await this.find({
    $or: [
      { requester: user1Id, status: "accepted" },
      { recipient: user1Id, status: "accepted" },
    ],
  });

  const user1FriendIds = user1Friendships.map((f: FriendshipDocument) =>
    f.requester.equals(user1Id) ? f.recipient : f.requester
  );

  if (user1FriendIds.length === 0) return [];

  const mutual = await this.find({
    $or: [
      {
        requester: user2Id,
        recipient: { $in: user1FriendIds },
        status: "accepted",
      },
      {
        recipient: user2Id,
        requester: { $in: user1FriendIds },
        status: "accepted",
      },
    ],
  }).limit(limit);

  return mutual.map((f: FriendshipDocument) =>
    f.requester.equals(user2Id) ? f.recipient : f.requester
  );
};

/* =====================================================
   MODEL
===================================================== */

type FriendshipModel = mongoose.Model<IFriendship> & FriendshipStatics;

const Friendship = mongoose.model<IFriendship, FriendshipModel>(
  "Friendship",
  FriendshipSchema
);

export default Friendship;
