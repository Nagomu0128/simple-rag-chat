import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/src/application/auth/verify-token";
import { uploadDocument } from "@/src/application/document/upload-document";
import { documentRepository } from "@/src/infrastructure/container";

export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await documentRepository.findByUserId(user.id);
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  let content: string;
  if (file.name.endsWith(".pdf")) {
    const { extractText } = await import("unpdf");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const result = await extractText(buffer);
    content = typeof result.text === "string" ? result.text : result.text.join("\n");
  } else {
    content = await file.text();
  }

  const doc = await uploadDocument(user.id, file.name, content);
  return NextResponse.json({ document: doc });
}
