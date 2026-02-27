import express, { Request, Response, NextFunction } from "express";
import { identify, IdentifyInput } from "./contactService";

const app = express();

app.use(express.json());

app.post("/identify", (req: Request, res: Response) => {
  try {
    const body = req.body as IdentifyInput;
    const result = identify({
      email: body.email ?? null,
      phoneNumber: body.phoneNumber ?? null,
    });

    res.status(200).json({
      contact: {
        primaryContactId: result.primaryContactId,
        emails: result.emails,
        phoneNumbers: result.phoneNumbers,
        secondaryContactIds: result.secondaryContactIds,
      },
    });
  } catch (err: any) {
    res.status(400).json({
      error: err?.message ?? "Something went wrong",
    });
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

