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
    const pdfModule = await import("pdf-parse");
    const pdfParse = pdfModule.default ?? pdfModule;
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdf = await pdfParse(buffer);
    content = pdf.text;
  } else {
    content = await file.text();
  }

  const doc = await uploadDocument(user.id, file.name, content);
  return NextResponse.json({ document: doc });
}
