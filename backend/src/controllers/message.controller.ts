import { Request, Response } from "express";
import db from "../db/db.js";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const { id: receivedId } = req.params;
    const senderId = req.user.id;

    let conversation = await db.conversation.findFirst({
      where: {
        participantIds: {
          hasEvery: [senderId, receivedId],
        },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          participantIds: {
            set: [senderId, receivedId],
          },
        },
      });
    }

    const newMessage = await db.message.create({
      data: {
        senderId,
        conversationId: conversation.id,
        body: message,
      },
    });

    if (newMessage) {
      conversation = await db.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          messages: {
            connect: {
              id: newMessage.id,
            },
          },
        },
      });
    }

    //socket.io code

    res.status(200).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id;

    const conversation = await db.conversation.findFirst({
      where: {
        participantIds: {
          hasEvery: [senderId, userToChatId],
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    res.status(200).json(conversation.messages);
  } catch (error: any) {
    console.error("Error in getMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsersForSidebar = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user.id;

    const users = await db.user.findMany({
      where: {
        id: {
          not: authUserId,
        },
      },
      select: {
        id: true,
        fullName: true,
        profilePic: true,
      },
    });

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
